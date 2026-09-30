import type { UsageReport } from "@oh-my-pi/pi-ai";
import type { ExtensionAPI, ExtensionContext } from "@oh-my-pi/pi-coding-agent";

const PROVIDER = "openai-codex";
const STATUS_KEY = "codex-usage";

function resetCountdown(resetsAt: number | string | undefined, now: number, showMinutes: boolean): string {
	const deadline = typeof resetsAt === "number" ? resetsAt : typeof resetsAt === "string" ? Date.parse(resetsAt) : NaN;
	if (!Number.isFinite(deadline)) return "";

	const minutes = showMinutes
		? Math.max(0, Math.ceil((deadline - now) / 60_000))
		: Math.max(0, Math.ceil((deadline - now) / 3_600_000)) * 60;
	if (minutes < 60) return showMinutes ? ` (${minutes}m)` : " (0h)";
	const hours = Math.floor(minutes / 60);
	const remainingMinutes = minutes % 60;
	if (hours < 24) return ` (${hours}h${remainingMinutes ? ` ${remainingMinutes}m` : ""})`;
	const days = Math.floor(hours / 24);
	const remainingHours = hours % 24;
	return ` (${days}d${remainingHours ? ` ${remainingHours}h` : ""}${remainingMinutes ? ` ${remainingMinutes}m` : ""})`;
}

export function formatCodexUsage(report: UsageReport | undefined): string {
	if (!report) return "—";

	const now = Date.now();
	const remaining = (windowId: string): string => {
		const limit = report.limits.find(limit => limit.scope.windowId === windowId);
		const fraction = limit?.amount.remainingFraction;
		if (typeof fraction !== "number" || !Number.isFinite(fraction)) return "—";
		const percent = Math.round(Math.max(0, Math.min(100, fraction * 100)));
		return `${percent}%${resetCountdown(limit.window?.resetsAt, now, windowId === "5h")}`;
	};

	return `5h ${remaining("5h")} · 7d ${remaining("7d")}`;
}

function selectReport(reports: UsageReport[], ctx: ExtensionContext): UsageReport | undefined {
	const codexReports = reports.filter(report => report.provider === PROVIDER);
	const accounts = ctx.modelRegistry.authStorage.oauth.accounts(PROVIDER, ctx.sessionManager.getSessionId());
	if (accounts.length === 0) return undefined;
	if (accounts.length === 1 && codexReports.length === 1) return codexReports[0];

	const account = accounts.length === 1 ? accounts[0] : accounts.find(candidate => candidate.active);
	if (!account) return undefined;
	const matches = codexReports.filter(report => {
		const metadata = report.metadata;
		if (!metadata) return false;
		if (account.orgId !== undefined || metadata.orgId !== undefined) {
			if (!account.orgId || account.orgId !== metadata.orgId) return false;
		}
		if (account.accountId && metadata.accountId) return account.accountId === metadata.accountId;
		return !!account.email && account.email === metadata.email;
	});
	return matches.length === 1 ? matches[0] : undefined;
}

export default function (pi: ExtensionAPI): void {
	let active = false;
	let stopped = false;
	let pending = false;
	let rerun = false;
	let controller: AbortController | undefined;
	let currentContext: ExtensionContext | undefined;

	async function poll(): Promise<void> {
		if (!active || stopped || !currentContext) return;
		if (pending) {
			rerun = true;
			return;
		}
		pending = true;
		const ctx = currentContext;
		const request = new AbortController();
		controller = request;
		try {
			const authStorage = ctx.modelRegistry.authStorage;
			if (!authStorage.credentials.hasOAuth(PROVIDER)) {
				ctx.ui.setStatus(STATUS_KEY, undefined);
				return;
			}
			const reports = await authStorage.usage.reports({
				baseUrlResolver: provider => ctx.modelRegistry.getProviderBaseUrl(provider),
				signal: request.signal,
			});
			if (!stopped && !request.signal.aborted) {
				ctx.ui.setStatus(STATUS_KEY, formatCodexUsage(selectReport(reports ?? [], ctx)));
			}
		} catch {
			if (!stopped && !request.signal.aborted) ctx.ui.setStatus(STATUS_KEY, "?");
		} finally {
			if (controller === request) controller = undefined;
			pending = false;
			if (rerun && !stopped) {
				rerun = false;
				void poll();
			}
		}
	}

	pi.on("session_start", (_event, ctx) => {
		if (ctx.mode !== "tui" || ctx.agent.kind !== "main") return;
		active = true;
		currentContext = ctx;
		ctx.setTimeout(() => void poll(), 0);
		ctx.setInterval(() => void poll(), 30_000);
	});

	pi.on("session_switch", (_event, ctx) => {
		if (!active || stopped) return;
		currentContext = ctx;
		controller?.abort();
		ctx.ui.setStatus(STATUS_KEY, undefined);
		void poll();
	});

	pi.on("session_shutdown", (_event, ctx) => {
		stopped = true;
		controller?.abort();
		ctx.ui.setStatus(STATUS_KEY, undefined);
	});
}

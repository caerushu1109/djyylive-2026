import {
  bestNeverChampions,
  championStrength,
  collapseRankings,
  historyChaos,
  historyOverview,
  historyShocks,
  historyTimeline,
  historyUpsets,
  teamProfiles,
} from "./history-data.js";
import {
  historyAllMatches,
  historyCurves,
  historyCurveTeams,
  historyExplorerTeams,
  historyExplorerYears,
} from "./history-generated.js";
import {
  archiveAwardLeaders,
  archiveAwards,
  archiveCardHeavyMatches,
  archiveConfederationReach,
  archiveFormatEvolution,
  archiveGoalTournaments,
  archiveGroupDominance,
  archiveHostStory,
  archiveHostSummary,
  archiveManagerLegends,
  archiveMilestoneGoals,
  archiveOverview,
  archivePodiumMap,
  archiveRefereeLegends,
  archiveShootoutMatches,
  archiveSquadEvergreens,
  archiveStageEvolution,
  archiveSubstitutionEras,
  archiveTeamDynasties,
  archiveTopAppearances,
  archiveTopScorers,
  archiveVenueAtlas,
} from "./worldcup-archive.js";
import {
  modelAssumptions,
  predictionTeams,
  titleOdds,
} from "./prediction-data.js";
import {
  wc2026CountdownTarget,
  wc2026PollOptions,
} from "./wc2026-data.js";
import {
  getMatchdayState,
  getMatchdaySourceMeta,
  hydrateMatchdayStateFromRuntimeSource,
} from "./matchday-source.js?v=20260312q";
import {
  defaultLocale,
  homepageCopy,
  localeUi,
  localizedRoutes,
  playerNameMap,
  teamNameMap,
  venueNameMap,
} from "./i18n-config.js";

await hydrateMatchdayStateFromRuntimeSource();
const matchdayState = getMatchdayState();
const matchdaySourceMeta = getMatchdaySourceMeta();
const matches = matchdayState.matches;
const groups = matchdayState.groups;
const pollOptions = wc2026PollOptions;
const countdownTarget = wc2026CountdownTarget;
const currentLocale = document.body.dataset.locale || defaultLocale;
const currentUi = localeUi[currentLocale] || localeUi[defaultLocale];
const teamFlagMap = {
  Mexico: "🇲🇽",
  "South Africa": "🇿🇦",
  "South Korea": "🇰🇷",
  Uruguay: "🇺🇾",
  Italy: "🇮🇹",
  Sweden: "🇸🇪",
  Hungary: "🇭🇺",
  "West Germany": "🇩🇪",
  Germany: "🇩🇪",
  Czechoslovakia: "🇨🇿",
  Chile: "🇨🇱",
  Cameroon: "🇨🇲",
  Bulgaria: "🇧🇬",
  Yugoslavia: "🇷🇸",
  Switzerland: "🇨🇭",
  Qatar: "🇶🇦",
  Canada: "🇨🇦",
  Brazil: "🇧🇷",
  Haiti: "🇭🇹",
  Scotland: "🏴",
  Morocco: "🇲🇦",
  "United States": "🇺🇸",
  Paraguay: "🇵🇾",
  Australia: "🇦🇺",
  Senegal: "🇸🇳",
  Nigeria: "🇳🇬",
  Ecuador: "🇪🇨",
  "Ivory Coast": "🇨🇮",
  Curacao: "🇨🇼",
  Netherlands: "🇳🇱",
  Tunisia: "🇹🇳",
  Japan: "🇯🇵",
  Belgium: "🇧🇪",
  Egypt: "🇪🇬",
  "New Zealand": "🇳🇿",
  Iran: "🇮🇷",
  France: "🇫🇷",
  "Saudi Arabia": "🇸🇦",
  Spain: "🇪🇸",
  "Cape Verde": "🇨🇻",
  Norway: "🇳🇴",
  Argentina: "🇦🇷",
  Austria: "🇦🇹",
  Algeria: "🇩🇿",
  Jordan: "🇯🇴",
  Portugal: "🇵🇹",
  Colombia: "🇨🇴",
  Uzbekistan: "🇺🇿",
  England: "🏴",
  Croatia: "🇭🇷",
  Ghana: "🇬🇭",
  Panama: "🇵🇦",
  "Soviet Union": "🇷🇺",
};

let activeGroup = getDefaultGroupKey();
let activeVote = "巴西";
let activeStage = "all";

function getCurrentRuntimeSource() {
  return new URLSearchParams(window.location.search).get("source");
}

function getCurrentMatchId() {
  return new URLSearchParams(window.location.search).get("id");
}

function withSourceParam(href) {
  const source = getCurrentRuntimeSource();
  if (!source) {
    return href;
  }

  const separator = href.includes("?") ? "&" : "?";
  return `${href}${separator}source=${encodeURIComponent(source)}`;
}

function shouldKeepSourceOnHref(href) {
  if (!href) {
    return false;
  }
  if (
    href.startsWith("#") ||
    href.startsWith("mailto:") ||
    href.startsWith("tel:") ||
    href.startsWith("javascript:")
  ) {
    return false;
  }
  if (/^https?:\/\//i.test(href)) {
    return false;
  }
  return true;
}

function preserveSourceAcrossDocument() {
  if (!getCurrentRuntimeSource()) {
    return;
  }

  document.querySelectorAll("a[href]").forEach((node) => {
    const href = node.getAttribute("href");
    if (!shouldKeepSourceOnHref(href)) {
      return;
    }
    node.setAttribute("href", withSourceParam(href));
  });
}

initPrimaryNav();
initCountdown();
initMatchesPreview();
initGroupStandings();
initPoll();
initSchedulePage();
initHistoryHubPage();
initHistoryUpsetsPage();
initHistoryArchivePage();
initHistoryPlayersPage();
initHistoryMatchesPage();
initHistoryPage();
initTeamsHubPage();
initPredictionPage();
initTeamHistoryPage();
initLivePage();
initMatchPage();
initLocaleSwitch();
initMatchdaySourceNotice();
preserveSourceAcrossDocument();
initDynamicMatchEntryLinks();
streamlinePageChrome();
streamlinePageContent();
initBottomTabBar();
initHomeMobileMore();
initPageMobileMore();

function initPrimaryNav() {
  const navLinks = document.querySelector(".nav__links");
  if (!navLinks) {
    return;
  }

  const activeGroup = getNavGroup();
  const localeSwitch = homepageCopy[currentLocale] || homepageCopy[defaultLocale];
  const links = currentLocale === "zh"
    ? [
        { key: "home", href: "/zh/index.html", label: "首页" },
        { key: "schedule", href: "/zh/schedule.html", label: "赛程" },
        { key: "history", href: "/zh/history.html", label: "历史" },
        { key: "prediction", href: "/zh/prediction.html", label: "预测" },
        { key: "teams", href: "/zh/teams.html", label: "球队" },
      ]
    : [
        { key: "home", href: "/en/index.html", label: "Home" },
        { key: "schedule", href: "/en/schedule.html", label: "Schedule" },
        { key: "history", href: "/en/history.html", label: "History" },
        { key: "prediction", href: "/en/prediction.html", label: "Prediction" },
        { key: "teams", href: "/en/teams.html", label: "Teams" },
      ];

  navLinks.innerHTML = `
    ${links
      .map(
        (link) => `
          <a href="${link.href}"${link.key === activeGroup ? ' aria-current="page"' : ""}>${link.label}</a>
        `
      )
      .join("")}
    <a href="${localeSwitch.switchHref}" data-locale-switch>${localeSwitch.switchLabel}</a>
  `;

  navLinks.querySelectorAll("a[href]").forEach((node) => {
    node.setAttribute("href", withSourceParam(node.getAttribute("href")));
  });
}

function getNavGroup() {
  const page = document.body.dataset.page;
  if (page === "home") {
    return "home";
  }
  if (["schedule", "live", "match"].includes(page)) {
    return "schedule";
  }
  if (
    ["history-hub", "history", "history-upsets", "history-archive", "history-players", "history-matches"]
      .includes(page)
  ) {
    return "history";
  }
  if (page === "prediction") {
    return "prediction";
  }
  if (["teams-hub", "team-history"].includes(page)) {
    return "teams";
  }
  return "";
}

function initCountdown() {
  const dayNode = document.querySelector("#days");
  const hourNode = document.querySelector("#hours");
  const minuteNode = document.querySelector("#minutes");

  if (!dayNode || !hourNode || !minuteNode) {
    return;
  }

  updateCountdown(dayNode, hourNode, minuteNode);
  window.setInterval(() => {
    updateCountdown(dayNode, hourNode, minuteNode);
  }, 60_000);
}

function initLocaleSwitch() {
  const switchNode = document.querySelector("[data-locale-switch]");
  if (!switchNode) {
    return;
  }

  const routeKey = document.body.dataset.routeKey || "home";
  const nextLocale = currentLocale === "zh" ? "en" : "zh";
  const fallbackConfig = homepageCopy[currentLocale] || homepageCopy[defaultLocale];
  let nextHref = localizedRoutes[routeKey]?.[nextLocale] || fallbackConfig.switchHref;

  if (routeKey === "match") {
    const matchId = new URLSearchParams(window.location.search).get("id");
    if (matchId) {
      nextHref = `${nextHref}?id=${matchId}`;
    }
  }

  switchNode.textContent = fallbackConfig.switchLabel;
  switchNode.setAttribute("href", withSourceParam(nextHref));
}

function initDynamicMatchEntryLinks() {
  const featuredMatchId = getCurrentMatchId() || getFeaturedMatchId();
  if (!featuredMatchId) {
    return;
  }

  document.querySelectorAll('a[href*="match.html?id="]').forEach((node) => {
    const rawHref = node.getAttribute("href");
    if (!rawHref || /^https?:\/\//i.test(rawHref)) {
      return;
    }

    const url = new URL(rawHref, window.location.href);
    if (!/match\.html$/i.test(url.pathname)) {
      return;
    }

    url.searchParams.set(
      "id",
      document.body.dataset.page === "match" && node.getAttribute("aria-current") === "page"
        ? (getCurrentMatchId() || featuredMatchId)
        : featuredMatchId
    );

    node.setAttribute("href", withSourceParam(`${url.pathname}${url.search}`));
  });
}

function initMatchdaySourceNotice() {
  const source = getCurrentRuntimeSource();
  if (!source) {
    return;
  }

  const shell = document.querySelector(".site-shell");
  const masthead = document.querySelector(".masthead");
  if (!shell || !masthead) {
    return;
  }

  const copy = currentLocale === "zh"
    ? {
        sampleTitle: "当前是 provider sample 预览",
        sampleBody: "这页不是本地静态 seed，而是在用 provider 结构样例验证赛程、比赛日和单场页的映射。",
        sportmonksSampleTitle: "当前是 SportMonks 真实结构 sample",
        sportmonksSampleBody: "这页正在用真实 SportMonks 字段形状的样例 payload 运行，适合先验证映射和页面结构是否对得上。",
        capturedTitle: "当前在读取本地导出的 SportMonks JSON",
        capturedBody: "这页正在读取 data/provider-live 里的真实导出文件。这个模式最适合本地验证，因为它不依赖浏览器直接请求第三方接口。",
        liveTitle: "SportMonks 实时请求已接通",
        liveBody: "这页已经从本地配置读取 SportMonks，并成功拉到运行时数据。",
        capturedFallbackTitle: "本地导出的 SportMonks JSON 未读到，已回退到本地 seed",
        capturedFallbackBody: "检查 data/provider-live/sportmonks-fixture.json 和 sportmonks-standings.json 是否存在，文件内容是否是完整 JSON。",
        fallbackTitle: "SportMonks 实时请求未成功，已回退到本地 seed",
        fallbackBody: "优先检查 Cloudflare Pages 里的 SPORTMONKS_API_TOKEN 是否已保存并重新部署，其次再看 token 本身或套餐权限。",
        errorLabel: "具体错误",
      }
    : {
        sampleTitle: "Provider sample preview",
        sampleBody: "This page is not using the local seed. It is running against a provider-shaped sample to validate schedule, live, and match rendering.",
        sportmonksSampleTitle: "SportMonks real-shape sample",
        sportmonksSampleBody: "This page is running against a sample payload shaped like the real SportMonks responses, which is useful for mapper validation.",
        capturedTitle: "Reading locally captured SportMonks JSON",
        capturedBody: "This page is reading real exported payloads from data/provider-live. This is the most stable local validation path because it avoids direct browser-to-provider requests.",
        liveTitle: "SportMonks live runtime connected",
        liveBody: "This page successfully loaded runtime data from the local SportMonks config.",
        capturedFallbackTitle: "Captured SportMonks JSON not found, fell back to local seed",
        capturedFallbackBody: "Check whether data/provider-live/sportmonks-fixture.json and sportmonks-standings.json exist locally and contain complete JSON.",
        fallbackTitle: "SportMonks live runtime failed and fell back to local seed",
        fallbackBody: "First check whether SPORTMONKS_API_TOKEN was saved in Cloudflare Pages and the project was redeployed. Then verify the token itself or plan access.",
        errorLabel: "Error details",
      };

  let tone = "info";
  let title = "";
  let body = "";

  if (matchdaySourceMeta.provider === "sportmonks-sample") {
    title = copy.sampleTitle;
    body = copy.sampleBody;
  } else if (matchdaySourceMeta.provider === "sportmonks-live-sample") {
    title = copy.sportmonksSampleTitle;
    body = copy.sportmonksSampleBody;
  } else if (matchdaySourceMeta.provider === "sportmonks-live" && matchdaySourceMeta.mode === "live") {
    tone = "success";
    title = copy.liveTitle;
    body = copy.liveBody;
  } else if (matchdaySourceMeta.provider === "sportmonks-captured" && matchdaySourceMeta.mode === "captured") {
    tone = "success";
    title = copy.capturedTitle;
    body = copy.capturedBody;
  } else if (matchdaySourceMeta.provider === "sportmonks-captured" && matchdaySourceMeta.mode === "captured-fallback") {
    tone = "warning";
    title = copy.capturedFallbackTitle;
    body = copy.capturedFallbackBody;
  } else if (matchdaySourceMeta.provider === "sportmonks-live" && matchdaySourceMeta.mode === "live-fallback") {
    tone = "warning";
    title = copy.fallbackTitle;
    body = copy.fallbackBody;
  }

  if (!title) {
    return;
  }

  const notice = document.createElement("section");
  notice.className = `source-notice source-notice--${tone}`;
  notice.innerHTML = `
    <strong>${title}</strong>
    <p>${body}</p>
    <p><strong>Runtime：</strong>${escapeHtml(`${matchdaySourceMeta.provider}/${matchdaySourceMeta.mode}`)}</p>
    ${matchdaySourceMeta.lastError ? `<p><strong>${copy.errorLabel}：</strong>${escapeHtml(matchdaySourceMeta.lastError)}</p>` : ""}
  `;

  shell.insertBefore(notice, masthead.nextSibling);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function streamlinePageChrome() {
  if (document.body.dataset.page === "home") {
    return;
  }

  const page = document.body.dataset.page || "";
  const hero = document.querySelector(".page-hero");
  if (!hero) {
    return;
  }

  const eyebrow = hero.querySelector(".eyebrow")?.textContent?.trim();
  const rawTitle = hero.querySelector("h1")?.textContent?.trim();
  const rawLede = hero.querySelector(".hero__lede")?.textContent?.trim();
  const compactPages = new Set([
    "schedule",
    "live",
    "match",
    "teams-hub",
    "team-history",
    "history-upsets",
    "history-archive",
    "history-players",
    "history-matches",
  ]);
  const miniPages = new Set([
    "live",
    "match",
    "teams-hub",
    "team-history",
    "history-upsets",
    "history-archive",
    "history-players",
    "history-matches",
  ]);
  const titleOverrides = {
    zh: {
      schedule: "赛程",
      live: "今日比赛",
      match: "比赛详情",
      "teams-hub": "球队",
      "team-history": "球队详情",
      "history-upsets": "冷门与 ELO",
      "history-archive": "历史资料库",
      "history-players": "人物与奖项",
      "history-matches": "比赛与时间线",
    },
    en: {
      schedule: "Schedule",
      live: "Today",
      match: "Match",
      "teams-hub": "Teams",
      "team-history": "Team profile",
      "history-upsets": "Upsets & Elo",
      "history-archive": "Archive",
      "history-players": "Players & Awards",
      "history-matches": "Matches & Timeline",
    },
  };
  const title = titleOverrides[currentLocale]?.[page] || rawTitle;
  const lede = compactPages.has(page) ? "" : rawLede;

  if (!title) {
    return;
  }

  const compact = document.createElement("section");
  compact.className = `page-header-bar${compactPages.has(page) ? " page-header-bar--tight" : ""}${miniPages.has(page) ? " page-header-bar--mini" : ""}`;
  compact.innerHTML = `
    ${eyebrow ? `<p class="eyebrow">${eyebrow}</p>` : ""}
    <h1>${title}</h1>
    ${lede ? `<p class="page-header-bar__lede">${lede}</p>` : ""}
  `;

  hero.replaceWith(compact);
}

function streamlinePageContent() {
  const page = document.body.dataset.page;
  const removablePages = new Set([
    "schedule",
    "live",
    "prediction",
    "teams-hub",
    "history-hub",
    "match",
  ]);
  const leanPages = new Set([
    "live",
    "match",
    "teams-hub",
    "team-history",
    "history-upsets",
    "history-archive",
    "history-players",
    "history-matches",
  ]);

  if (!removablePages.has(page)) {
    // continue, lean pages still need footer and intro cleanup
  }

  const sections = [...document.querySelectorAll("main > .section")];
  const firstSection = sections[0];
  if (firstSection && removablePages.has(page)) {
    const summaryStrip = firstSection.querySelector(".summary-strip");
    if (summaryStrip && !firstSection.querySelector("[id]")) {
      firstSection.remove();
    }
  }

  if (leanPages.has(page)) {
    document.querySelectorAll(".section__intro").forEach((node) => node.remove());
    document.querySelectorAll("footer.footer").forEach((node) => node.remove());
  }
}

function initBottomTabBar() {
  const shell = document.querySelector(".site-shell");
  if (!shell) {
    return;
  }

  const activeGroup = getNavGroup();
  const tabs = currentLocale === "zh"
    ? [
        { key: "schedule", href: "/zh/schedule.html", label: "赛程" },
        { key: "history", href: "/zh/history.html", label: "历史" },
        { key: "prediction", href: "/zh/prediction.html", label: "预测" },
        { key: "teams", href: "/zh/teams.html", label: "球队" },
      ]
    : [
        { key: "schedule", href: "/en/schedule.html", label: "Schedule" },
        { key: "history", href: "/en/history.html", label: "History" },
        { key: "prediction", href: "/en/prediction.html", label: "Prediction" },
        { key: "teams", href: "/en/teams.html", label: "Teams" },
      ];

  const tabBar = document.createElement("nav");
  tabBar.className = "bottom-tabbar";
  tabBar.setAttribute("aria-label", currentLocale === "zh" ? "底部导航" : "Bottom navigation");
  tabBar.innerHTML = tabs
    .map(
      (tab) => `
        <a href="${tab.href}"${tab.key === activeGroup ? ' aria-current="page"' : ""}>${tab.label}</a>
      `
    )
    .join("");

  tabBar.querySelectorAll("a[href]").forEach((node) => {
    node.setAttribute("href", withSourceParam(node.getAttribute("href")));
  });

  shell.appendChild(tabBar);
}

function initHomeMobileMore() {
  const toggleNode = document.querySelector("#home-mobile-more");
  if (!toggleNode || document.body.dataset.page !== "home") {
    return;
  }

  const button = toggleNode.querySelector("button");
  if (!button) {
    return;
  }

  const expandedLabel = currentLocale === "zh" ? "收起更多内容" : "Show less";
  const collapsedLabel = currentLocale === "zh" ? "展开更多内容" : "Show more sections";

  const sync = () => {
    const expanded = document.body.classList.contains("is-home-expanded");
    button.textContent = expanded ? expandedLabel : collapsedLabel;
    button.setAttribute("aria-expanded", String(expanded));
  };

  button.addEventListener("click", () => {
    document.body.classList.toggle("is-home-expanded");
    sync();
  });

  sync();
}

function initPageMobileMore() {
  const toggleNode = document.querySelector("#page-mobile-more");
  if (!toggleNode) {
    return;
  }

  const button = toggleNode.querySelector("button");
  if (!button) {
    return;
  }

  const expandedLabel = currentLocale === "zh" ? "收起更多内容" : "Show less";
  const collapsedLabel = currentLocale === "zh" ? "展开更多内容" : "Show more sections";

  const sync = () => {
    const expanded = document.body.classList.contains("is-page-expanded");
    button.textContent = expanded ? expandedLabel : collapsedLabel;
    button.setAttribute("aria-expanded", String(expanded));
  };

  button.addEventListener("click", () => {
    document.body.classList.toggle("is-page-expanded");
    sync();
  });

  sync();
}

function initMatchesPreview() {
  const matchGrid = document.querySelector("#match-grid");
  if (!matchGrid) {
    return;
  }

  matchGrid.innerHTML = getHomepageMatches()
    .map(renderMatchCard)
    .join("");
}

function initGroupStandings() {
  const groupTabs = document.querySelector("#group-tabs");
  const groupTableBody = document.querySelector("#group-table-body");

  if (!groupTabs || !groupTableBody) {
    return;
  }

  activeGroup = getDefaultGroupKey();
  renderGroupTabs(groupTabs, groupTableBody);
  renderGroupTable(groupTableBody, activeGroup);
}

function getDefaultGroupKey() {
  const groupKeys = Object.keys(groups);
  return groupKeys[0] || "A";
}

function initPoll() {
  const pollNode = document.querySelector("#poll");
  if (!pollNode) {
    return;
  }

  renderPoll(pollNode);
}

function initSchedulePage() {
  const filterNode = document.querySelector("#schedule-filters");
  const scheduleList = document.querySelector("#schedule-list");
  const liveNowNode = document.querySelector("#schedule-live-now");
  const upcomingNode = document.querySelector("#schedule-upcoming");
  const teamSelect = document.querySelector("#schedule-team-select");
  const statusSelect = document.querySelector("#schedule-status-select");

  if (!filterNode || !scheduleList) {
    return;
  }

  renderScheduleFilters(filterNode, scheduleList);
  renderScheduleList(scheduleList, activeStage);

  if (liveNowNode) {
    const liveMatches = matches.filter((match) => match.phase === "in_match");
    liveNowNode.innerHTML = liveMatches.length
      ? liveMatches.map(renderMatchSpotlight).join("")
      : renderMatchStateNotice(
          currentLocale === "zh" ? "本届世界杯尚未开赛" : "The tournament has not kicked off yet",
          currentLocale === "zh"
            ? "现在先看揭幕周和首轮焦点赛程，Live 页面开赛后会自动承担高频入口。"
            : "For now, opening week and first-round headline fixtures matter more. Once the tournament starts, the live page becomes a high-frequency entry point."
        );
  }

  if (upcomingNode) {
    upcomingNode.innerHTML = prioritizeMatches(
      matches.filter((match) => match.phase === "pre_match"),
      4
    )
      .map(renderMatchSpotlight)
      .join("");
  }

  if (teamSelect && statusSelect) {
    const teams = [...new Set(matches.flatMap((match) => [match.home, match.away]))].sort();
    teamSelect.innerHTML = [`<option value="all">${currentUi.allTeams}</option>`, ...teams.map((team) => `<option value="${team}">${displayTeamWithFlag(team)}</option>`)].join("");
    statusSelect.innerHTML = `
      <option value="all">${currentUi.allStatus}</option>
      <option value="scheduled">${currentUi.statusScheduled}</option>
      <option value="live">${currentUi.statusLive}</option>
      <option value="finished">${currentUi.statusFinished}</option>
    `;

    const update = () => {
      let filtered = [...matches];
      if (teamSelect.value !== "all") {
        filtered = filtered.filter(
          (match) => match.home === teamSelect.value || match.away === teamSelect.value
        );
      }
      if (statusSelect.value !== "all") {
        filtered = filtered.filter((match) => match.status === statusSelect.value);
      }
      scheduleList.innerHTML = sortMatchesChronologically(filtered).map(renderScheduleRow).join("");
    };

    teamSelect.addEventListener("change", update);
    statusSelect.addEventListener("change", update);
    update();
  }
}

function initLivePage() {
  const liveNowNode = document.querySelector("#live-now");
  const upcomingNode = document.querySelector("#live-upcoming");
  const watchlistNode = document.querySelector("#live-watchlist");

  if (!liveNowNode || !upcomingNode || !watchlistNode) {
    return;
  }

  const liveMatches = matches.filter((match) => match.phase === "in_match");
  const postMatches = matches.filter((match) => match.phase === "post_match");
  liveNowNode.innerHTML = liveMatches.length
    ? liveMatches.map(renderLiveCard).join("")
    : renderMatchStateNotice(
        currentLocale === "zh" ? "尚未进入比赛日实时阶段" : "Live matchday mode has not started yet",
        currentLocale === "zh"
          ? "现在更适合先看揭幕战、豪门首秀和小组赛首轮重点比赛。"
          : "Before kickoff, it makes more sense to surface the opener, heavyweight debuts, and the strongest first-round group matches."
      );

  upcomingNode.innerHTML = matches
    .filter((match) => match.phase === "pre_match")
    .sort((a, b) => parseKickoffValue(a) - parseKickoffValue(b))
    .slice(0, 8)
    .map(renderLiveCard)
    .join("");

  const watchlistMatches = liveMatches.length
    ? prioritizeMatches(liveMatches, 4)
    : postMatches.length
      ? prioritizeMatches(postMatches, 4)
      : getHomepageMatches();

  watchlistNode.innerHTML = watchlistMatches.map(renderWatchlistCard).join("");
}

function initMatchPage() {
  const heroNode = document.querySelector("#match-hero");
  const timelineNode = document.querySelector("#match-timeline");
  const statsNode = document.querySelector("#match-stats");
  const relatedNode = document.querySelector("#match-related");

  if (!heroNode || !timelineNode || !statsNode || !relatedNode) {
    return;
  }

  const matchId =
    new URLSearchParams(window.location.search).get("id") ||
    getFeaturedMatchId() ||
    matches[0]?.id;
  const detail = matchdayState.getMatchDetail(matchId);
  const match = detail.match;
  const renderEventCopy = (event) => {
    if (event.type === "goal") {
      const bits = [event.player, event.result, event.info || event.addition].filter(Boolean);
      return bits.join(" · ");
    }
    if (event.type === "substitution") {
      const bits = [event.player, event.related_player ? `↔ ${event.related_player}` : "", event.info || event.addition].filter(Boolean);
      return bits.join(" · ");
    }
    if (event.type === "yellowcard" || event.type === "redcard" || event.type === "card") {
      const bits = [event.player, event.info || event.addition].filter(Boolean);
      return bits.join(" · ");
    }
    return [event.player, event.detail].filter(Boolean).join(" · ") || event.detail;
  };
  const t = currentLocale === "zh"
    ? {
        status: "当前状态",
        preMatch: "官方赛前信息",
        liveMinute: "实时比赛中",
        postMatch: "已结束",
        phaseCopy: {
          pre_match: "赛前信息",
          in_match: "实时比赛中",
          post_match: "赛后回看",
        },
        prelude: "赛前",
        angle: "看点",
        after: "赛后",
        reserve: "预留",
        timelineLabel: {
          context: "背景",
          lineup: "阵容",
          angle: "看点",
          goal: "进球",
          card: "牌",
          substitution: "换人",
        },
        possession: "控球",
        shots: "射门",
        shotsOnTarget: "射正",
        corners: "角球",
        yellowcards: "黄牌",
        xg: "xG 占位",
        backSchedule: "回到赛程页",
        toLive: "进入 live 总览",
        toPrediction: "查看预测页",
      }
    : {
        status: "Status",
        preMatch: "Official pre-match info",
        liveMinute: "Live now",
        postMatch: "Full time",
        phaseCopy: {
          pre_match: "Pre-match",
          in_match: "Live now",
          post_match: "After the whistle",
        },
        prelude: "Pre-match",
        angle: "Angle",
        after: "After",
        reserve: "Reserved",
        timelineLabel: {
          context: "Context",
          lineup: "Lineups",
          angle: "Angle",
          goal: "Goal",
          card: "Card",
          substitution: "Sub",
        },
        possession: "Possession",
        shots: "Shots",
        shotsOnTarget: "Shots on target",
        corners: "Corners",
        yellowcards: "Yellow cards",
        xg: "xG",
        backSchedule: "Back to schedule",
        toLive: "Open live overview",
        toPrediction: "Open prediction",
      };

  heroNode.innerHTML = `
    <div class="match-hero-card">
      <p class="eyebrow">${displayStage(match.stage)}</p>
      <h2>${displayTeam(match.home)} vs ${displayTeam(match.away)}</h2>
      <p class="hero__lede">${match.kickoff} · ${displayVenue(match.venue)} · ${t.phaseCopy[match.phase] || humanizeMatchStatus(match)}</p>
      <div class="match-scoreline">
        <strong>${match.score}</strong>
        <span>${match.phase === "in_match" ? (match.minute || t.liveMinute) : match.phase === "post_match" ? t.postMatch : t.preMatch}</span>
      </div>
    </div>
  `;

  timelineNode.innerHTML = detail.timeline
    .map(
      (event) => `
        <article class="event-row">
          <strong>${t.timelineLabel[event.type] || (currentLocale === "zh" ? "事件" : "Event")}</strong>
          <span>${event.minute ? `${event.minute}'${event.stoppage_minute ? `+${event.stoppage_minute}` : ""} · ` : ""}${event.team ? `${displayTeam(event.team)} · ` : ""}${renderEventCopy(event)}</span>
        </article>
      `
    )
    .join("");

  statsNode.innerHTML = `
    <article class="stat-tile"><span>${t.possession}</span><strong>${detail.stats.possession_home}% / ${detail.stats.possession_away}%</strong></article>
    <article class="stat-tile"><span>${t.shots}</span><strong>${detail.stats.shots_home} / ${detail.stats.shots_away}</strong></article>
    <article class="stat-tile"><span>${t.shotsOnTarget}</span><strong>${detail.stats.shots_on_target_home} / ${detail.stats.shots_on_target_away}</strong></article>
    <article class="stat-tile"><span>${t.corners}</span><strong>${detail.stats.corners_home} / ${detail.stats.corners_away}</strong></article>
    <article class="stat-tile"><span>${t.yellowcards}</span><strong>${detail.stats.yellowcards_home} / ${detail.stats.yellowcards_away}</strong></article>
    <article class="stat-tile"><span>${t.xg}</span><strong>${detail.stats.xg_home} / ${detail.stats.xg_away}</strong></article>
  `;

  relatedNode.innerHTML = `
    <a class="button button--ghost" href="${withSourceParam(currentLocale === "zh" ? "/zh/schedule.html" : "/en/schedule.html")}">${t.backSchedule}</a>
    <a class="button button--ghost" href="${withSourceParam(currentLocale === "zh" ? "/zh/live.html" : "/en/live.html")}">${t.toLive}</a>
    <a class="button button--ghost" href="${withSourceParam(predictionPath())}">${t.toPrediction}</a>
  `;
}

function renderStoryRows(items, formatter) {
  return items
    .map((item, index) => {
      const config = formatter(item, index);
      return `
        <article class="story-row${config.accent ? ` story-row--${config.accent}` : ""}">
          <span class="${config.metric ? "story-row__metric" : "story-row__index"}">${config.lead}</span>
          <div class="story-row__body">
            <strong>${config.title}</strong>
            <p>${config.copy}</p>
          </div>
        </article>
      `;
    })
    .join("");
}

function renderArchiveChips(items, formatter) {
  return `
    <div class="archive-chip-list">
      ${items
        .map((item) => {
          const chip = formatter(item);
          return `
            <article class="archive-chip">
              <strong>${chip.value}</strong>
              <span>${chip.label}</span>
            </article>
          `;
        })
        .join("")}
    </div>
  `;
}

function setupCollapsibleSection(target, options = {}) {
  if (!target) {
    return;
  }

  const defaultButtonText = currentLocale === "zh" ? "展开更多" : "Show more";
  const defaultButtonTextExpanded = currentLocale === "zh" ? "收起内容" : "Hide section";
  const defaultItemLabel = currentLocale === "zh" ? "内容" : "section";

  const {
    collapsedHeight = 360,
    buttonText = defaultButtonText,
    buttonTextExpanded = defaultButtonTextExpanded,
    itemLabel = defaultItemLabel,
  } = options;

  let button = target.nextElementSibling;
  if (!button || !button.classList.contains("history-collapse-button")) {
    button = document.createElement("button");
    button.type = "button";
    button.className = "history-collapse-button";
    target.insertAdjacentElement("afterend", button);
  }

  target.classList.add("history-collapsible");
  target.style.setProperty("--collapsed-height", `${collapsedHeight}px`);

  const needsCollapse = target.scrollHeight > collapsedHeight + 24;
  if (!needsCollapse) {
    target.classList.remove("is-collapsed");
    target.classList.remove("is-expanded");
    button.hidden = true;
    return;
  }

  button.hidden = false;

  if (!target.classList.contains("is-expanded")) {
    target.classList.add("is-collapsed");
  }

  const syncButton = () => {
    const expanded = target.classList.contains("is-expanded");
    button.textContent = expanded
      ? buttonTextExpanded
      : `${buttonText}${itemLabel ? ` · ${itemLabel}` : ""}`;
    button.setAttribute("aria-expanded", expanded ? "true" : "false");
  };

  button.onclick = () => {
    const expanded = target.classList.toggle("is-expanded");
    target.classList.toggle("is-collapsed", !expanded);
    syncButton();
  };

  syncButton();
}

function setupSectionObserver() {
  const toc = document.querySelector("#history-toc");
  if (!toc) {
    return;
  }

  const links = [...toc.querySelectorAll("a[data-target]")];
  const sections = links
    .map((link) => document.getElementById(link.dataset.target))
    .filter(Boolean);

  if (!links.length || !sections.length) {
    return;
  }

  const setActive = (id) => {
    links.forEach((link) => {
      link.classList.toggle("is-active", link.dataset.target === id);
    });
  };

  const observer = new IntersectionObserver(
    (entries) => {
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
      if (visible.length) {
        setActive(visible[0].target.id);
      }
    },
    {
      rootMargin: "-15% 0px -60% 0px",
      threshold: [0.15, 0.3, 0.6],
    }
  );

  sections.forEach((section) => observer.observe(section));
  setActive(sections[0].id);
}

function renderTeamProfileMarkup(profile) {
  const profileCopy = currentLocale === "zh"
    ? {
        record: "战绩",
        matches: "场",
        goalsFor: "进球",
        goalsAgainst: "失球",
        peak: "峰值 ELO",
        latest: "最近 ELO",
        latestSample: "年样本",
        upsetWin: "代表性逆袭",
        upsetLoss: "最痛爆冷失利",
      }
    : {
        record: "Record",
        matches: "matches",
        goalsFor: "goals for",
        goalsAgainst: "goals against",
        peak: "Peak Elo",
        latest: "Latest Elo",
        latestSample: "sample year",
        upsetWin: "Signature upset win",
        upsetLoss: "Most painful upset loss",
      };

  return `
    <div class="team-profile">
      <div class="team-profile__stats">
        <article class="history-stat">
          <span class="history-stat__label">${profileCopy.record}</span>
          <strong>${profile.wins}-${profile.draws}-${profile.losses}</strong>
          <p>${profile.matches} ${profileCopy.matches} · ${profile.gf} ${profileCopy.goalsFor} · ${profile.ga} ${profileCopy.goalsAgainst}</p>
        </article>
        <article class="history-stat">
          <span class="history-stat__label">${profileCopy.peak}</span>
          <strong>${profile.peakElo}</strong>
          <p>${profile.peakDate}</p>
        </article>
        <article class="history-stat">
          <span class="history-stat__label">${profileCopy.latest}</span>
          <strong>${profile.latestElo}</strong>
          <p>${profile.latestYear} ${profileCopy.latestSample}</p>
        </article>
      </div>
      <div class="team-profile__notes">
        <article class="sidebar-card">
          <p class="story-card__tag">${profileCopy.upsetWin}</p>
          <h3>${displayProfileMatchNote(profile.biggestUpsetWin)}</h3>
        </article>
        <article class="sidebar-card">
          <p class="story-card__tag">${profileCopy.upsetLoss}</p>
          <h3>${displayProfileMatchNote(profile.worstUpsetLoss)}</h3>
        </article>
      </div>
      <div class="milestone-track">
        ${profile.milestones
          .map(
            (point) => `
              <article class="milestone-point">
                <span>${point.year}</span>
                <strong>${point.elo}</strong>
              </article>
            `
          )
          .join("")}
      </div>
    </div>
  `;
}

function mountTeamProfileSelect(selectNode, profileNode, defaultTeam = "Brazil") {
  const teams = Object.keys(teamProfiles);
  selectNode.innerHTML = teams
    .map((team) => `<option value="${team}">${team}</option>`)
    .join("");
  selectNode.value = defaultTeam;

  const update = () => {
    const profile = teamProfiles[selectNode.value];
    if (!profile) {
      return;
    }
    profileNode.innerHTML = renderTeamProfileMarkup(profile);
  };

  selectNode.addEventListener("change", update);
  update();
}

function initHistoryHubPage() {
  const overviewNode = document.querySelector("#history-home-overview");
  const summaryNode = document.querySelector("#history-home-summary");
  const featuredNode = document.querySelector("#history-home-featured");
  const featureNoteNode = document.querySelector("#history-home-feature-note");
  const teamSelect = document.querySelector("#history-home-team-select");
  const teamProfileNode = document.querySelector("#history-home-team-profile");
  const championsChartNode = document.querySelector("#history-home-chart-champions");
  const goalsChartNode = document.querySelector("#history-home-chart-goals");

  if (
    !overviewNode ||
    !summaryNode ||
    !featuredNode ||
    !featureNoteNode ||
    !teamSelect ||
    !teamProfileNode ||
    !championsChartNode ||
    !goalsChartNode
  ) {
    return;
  }

  const historyHomeCopy = currentLocale === "zh"
    ? {
        diffTitle: "最值钱的差异化",
        diffCopy: "ELO 让历史页不只告诉你谁赢了，还能解释为什么这场胜负足够反常。",
        structureTitle: "结构数据补全",
        structureCopy: "worldcup 数据库把主办国、球场、球员、奖项和阶段结构全部补成可展示的事实层。",
        readTitle: "阅读方式重构",
        readCopy: "首页只做精选和导览，深数据已经拆到独立专题页，整页长度终于可控。",
        featureNote: "先看这四块就够了：最极端冷门、最剧烈震荡、最强无冕者，以及历史上最稳定的豪门样本。",
        upsetGap: "冷门差值",
        fullUpsets: "看完整冷门榜",
        swing: "单场总波动",
        fullShock: "看完整 ELO 冲击波",
        peakElo: "峰值 ELO",
        avgElo: "平均 ELO",
        neverList: "看无冕者列表",
        hosted: "承办了",
        matches: "场世界杯比赛。",
        archiveFeature: "看资料库专题",
        titleCount: "世界杯冠军次数",
        titleUnit: "冠",
        goalsTrend: "世界杯进球走势",
      }
    : {
        diffTitle: "Differentiator",
        diffCopy: "Elo lets the history section explain not only who won, but why a result was truly abnormal.",
        structureTitle: "Structured archive layer",
        structureCopy: "The worldcup database fills in hosts, venues, players, awards, and tournament structure as a factual foundation.",
        readTitle: "Reading flow rebuilt",
        readCopy: "The history homepage now acts as a guide, while deeper data has been split into dedicated features.",
        featureNote: "These four highlights are enough to understand the page quickly: the biggest upset, the biggest shockwave, the strongest non-champion, and one archive signal.",
        upsetGap: "Upset gap",
        fullUpsets: "Open full upset list",
        swing: "Match swing",
        fullShock: "Open full Elo shockwave list",
        peakElo: "Peak Elo",
        avgElo: "Average Elo",
        neverList: "Open non-champion list",
        hosted: "hosted",
        matches: "World Cup matches.",
        archiveFeature: "Open archive feature",
        titleCount: "World Cup titles",
        titleUnit: "titles",
        goalsTrend: "World Cup goals trend",
      };

  overviewNode.innerHTML = historyOverview
    .map((item, index) => {
      const localized = localizeHistoryOverview(item, index);
      return `
        <article class="history-stat">
          <span class="history-stat__label">${localized.label}</span>
          <strong>${item.value}</strong>
          <p>${localized.detail}</p>
        </article>
      `;
    })
    .join("");

  summaryNode.innerHTML = `
    <article class="summary-pill">
      <strong>${historyHomeCopy.diffTitle}</strong>
      <span>${historyHomeCopy.diffCopy}</span>
    </article>
    <article class="summary-pill">
      <strong>${historyHomeCopy.structureTitle}</strong>
      <span>${historyHomeCopy.structureCopy}</span>
    </article>
    <article class="summary-pill">
      <strong>${historyHomeCopy.readTitle}</strong>
      <span>${historyHomeCopy.readCopy}</span>
    </article>
  `;

  featureNoteNode.textContent = historyHomeCopy.featureNote;

  featuredNode.innerHTML = `
    <article class="feature-card history-mini-card">
      <p class="story-card__tag">Biggest Upset</p>
      <h3>${displayTeam(historyUpsets[0].winner)} ${displayScore(historyUpsets[0].score)} ${displayTeam(historyUpsets[0].loser)}</h3>
      <p>${historyUpsets[0].date} · ${historyHomeCopy.upsetGap} ${historyUpsets[0].eloGap}</p>
      <a href="${historyUpsetsPath()}">${historyHomeCopy.fullUpsets}</a>
    </article>
    <article class="feature-card history-mini-card">
      <p class="story-card__tag">Biggest Shockwave</p>
      <h3>${displayTeam(historyShocks[0].home)} ${displayScore(historyShocks[0].score)} ${displayTeam(historyShocks[0].away)}</h3>
      <p>${historyShocks[0].date} · ${historyHomeCopy.swing} ${historyShocks[0].swing}</p>
      <a href="${historyUpsetsPath()}">${historyHomeCopy.fullShock}</a>
    </article>
    <article class="feature-card history-mini-card">
      <p class="story-card__tag">Strongest Without Title</p>
      <h3>${displayTeam(bestNeverChampions[0].team)}</h3>
      <p>${historyHomeCopy.peakElo} ${bestNeverChampions[0].peakElo} · ${historyHomeCopy.avgElo} ${bestNeverChampions[0].avgElo}</p>
      <a href="${historyUpsetsPath()}">${historyHomeCopy.neverList}</a>
    </article>
    <article class="feature-card history-mini-card">
      <p class="story-card__tag">Archive Highlight</p>
      <h3>${displayVenue(archiveVenueAtlas.cities[0].city)}</h3>
      <p>${displayTeam(archiveVenueAtlas.cities[0].country)} ${historyHomeCopy.hosted} ${archiveVenueAtlas.cities[0].matches} ${historyHomeCopy.matches}</p>
      <a href="${historyArchivePath()}">${historyHomeCopy.archiveFeature}</a>
    </article>
  `;

  mountTeamProfileSelect(teamSelect, teamProfileNode, "Brazil");

  championsChartNode.innerHTML = renderBarChartSvg(
    archivePodiumMap
      .slice(0, 6)
      .map((item) => ({ label: item.team, value: item.titles })),
    historyHomeCopy.titleCount,
    historyHomeCopy.titleUnit
  );

  goalsChartNode.innerHTML = renderLineChartSvg(
    historyTimeline.map((item) => ({ date: String(item.year), elo: item.goals })),
    historyHomeCopy.goalsTrend,
    "history-home-goals-gradient"
  );
}

function initHistoryUpsetsPage() {
  const upsetsNode = document.querySelector("#history-upsets");
  const shocksNode = document.querySelector("#history-shocks");
  const chaosNode = document.querySelector("#history-chaos");
  const championStrengthNode = document.querySelector("#champion-strength");
  const neverChampionsNode = document.querySelector("#never-champions");
  const collapseNode = document.querySelector("#collapse-rankings");
  const upsetSummaryNoteNode = document.querySelector("#upset-summary-note");
  const shockSummaryNoteNode = document.querySelector("#shock-summary-note");
  const championSummaryNoteNode = document.querySelector("#champion-summary-note");
  const neverSummaryNoteNode = document.querySelector("#never-summary-note");
  const collapseSummaryNoteNode = document.querySelector("#collapse-summary-note");

  if (
    !upsetsNode ||
    !shocksNode ||
    !chaosNode ||
    !championStrengthNode ||
    !neverChampionsNode ||
    !collapseNode ||
    !upsetSummaryNoteNode ||
    !shockSummaryNoteNode ||
    !championSummaryNoteNode ||
    !neverSummaryNoteNode ||
    !collapseSummaryNoteNode
  ) {
    return;
  }

  const upsetsCopy = currentLocale === "zh"
    ? {
        upsetSummary: `结论先看：这份 ELO 表里最极端的爆冷是 ${historyUpsets[0].winner} ${historyUpsets[0].score} ${historyUpsets[0].loser}，赛前强弱差达到 ${historyUpsets[0].eloGap}。`,
        shockSummary: `结论先看：单场 ELO 总波动最大的是 ${historyShocks[0].date} 的 ${historyShocks[0].home} ${historyShocks[0].score} ${historyShocks[0].away}，总震荡 ${historyShocks[0].swing}。`,
        championSummary: `结论先看：按击败对手平均 ELO 计算，${championStrength[0].year} ${championStrength[0].champion} 是这份模型里“通关含金量”最高的冠军。`,
        neverSummary: `结论先看：${bestNeverChampions[0].team} 是这份历史样本里最强的无冕者，峰值 ELO 达到 ${bestNeverChampions[0].peakElo}。`,
        collapseSummary: `结论先看：${collapseRankings[0].year} ${collapseRankings[0].team} 的翻车最具代表性，短赛会制足以让顶级强队迅速失速。`,
        upsetGap: "冷门差值",
        preMatchElo: "赛前 ELO",
        preGap: "赛前 ELO 差",
        totalSwing: "单场总波动",
        upsets: "次爆冷",
        eloSwing: "ELO 波动",
        avgGoals: "平均进球",
        avgUpsetGap: "爆冷幅度",
        avgGoalsValue: "平均进球",
        avgGapValue: "平均冷门差值",
        defeatedAvg: "击败对手平均 ELO",
        oppAvg: "全部对手平均 ELO",
        peakElo: "峰值 ELO",
        avgElo: "平均 ELO",
        matches: "场比赛",
        upsetLosses: "爆冷失利",
        eloDrop: "ELO 跌幅",
        upsetsLabel: "冷门榜",
        shocksLabel: "震荡榜",
        championLabel: "冠军含金量",
        neverLabel: "无冕之王",
        collapseLabel: "翻车榜",
      }
    : {
        upsetSummary: `First take: the most extreme upset in this Elo sample is ${displayTeam(historyUpsets[0].winner)} ${displayScore(historyUpsets[0].score)} ${displayTeam(historyUpsets[0].loser)}, with a pre-match gap of ${historyUpsets[0].eloGap}.`,
        shockSummary: `First take: the largest single-match Elo shockwave came from ${historyShocks[0].date}, when ${displayTeam(historyShocks[0].home)} ${displayScore(historyShocks[0].score)} ${displayTeam(historyShocks[0].away)} produced a total swing of ${historyShocks[0].swing}.`,
        championSummary: `First take: by average defeated-opponent Elo, ${championStrength[0].year} ${displayTeam(championStrength[0].champion)} rates as the highest-weight champion in this model.`,
        neverSummary: `First take: ${displayTeam(bestNeverChampions[0].team)} is the strongest team without a title in this historical sample, reaching a peak Elo of ${bestNeverChampions[0].peakElo}.`,
        collapseSummary: `First take: ${collapseRankings[0].year} ${displayTeam(collapseRankings[0].team)} represents the clearest heavyweight collapse, showing how quickly a short tournament can punish elite teams.`,
        upsetGap: "Upset gap",
        preMatchElo: "Pre-match Elo",
        preGap: "Pre-match Elo gap",
        totalSwing: "Total match swing",
        upsets: "upsets",
        eloSwing: "Elo swing",
        avgGoals: "Average goals",
        avgUpsetGap: "Upset severity",
        avgGoalsValue: "Average goals",
        avgGapValue: "Average upset gap",
        defeatedAvg: "Average defeated-opponent Elo",
        oppAvg: "Average opponent Elo",
        peakElo: "Peak Elo",
        avgElo: "Average Elo",
        matches: "matches",
        upsetLosses: "upset losses",
        eloDrop: "Elo drop",
        upsetsLabel: "upsets",
        shocksLabel: "shockwaves",
        championLabel: "champion strength",
        neverLabel: "best never-champions",
        collapseLabel: "collapse rankings",
      };

  upsetSummaryNoteNode.textContent = upsetsCopy.upsetSummary;
  shockSummaryNoteNode.textContent = upsetsCopy.shockSummary;
  championSummaryNoteNode.textContent = upsetsCopy.championSummary;
  neverSummaryNoteNode.textContent = upsetsCopy.neverSummary;
  collapseSummaryNoteNode.textContent = upsetsCopy.collapseSummary;

  upsetsNode.innerHTML = renderStoryRows(historyUpsets, (item, index) => ({
    lead: index + 1,
    title: `${displayTeamWithFlag(item.winner)} ${displayScore(item.score)} ${displayTeamWithFlag(item.loser)}`,
    copy: `${item.date} · ${upsetsCopy.upsetGap} ${item.eloGap} · ${upsetsCopy.preMatchElo} ${item.winnerElo} vs ${item.loserElo}`,
    accent: index < 3 ? `top-${index + 1}` : "",
  }));

  shocksNode.innerHTML = renderStoryRows(historyShocks, (item) => ({
    lead: item.swing,
    metric: true,
    title: `${displayTeamWithFlag(item.home)} ${displayScore(item.score)} ${displayTeamWithFlag(item.away)}`,
    copy: `${item.date} · ${upsetsCopy.preGap} ${item.preGap} · ${upsetsCopy.totalSwing} ${item.swing}`,
  }));

  chaosNode.innerHTML = historyChaos
    .map(
      (item) => `
        <article class="chaos-card">
          <div class="chaos-card__top">
            <strong>${item.year}</strong>
            <span>${item.upsets} ${upsetsCopy.upsets}</span>
          </div>
          <div class="chaos-card__bars">
            <div>
              <label>${upsetsCopy.eloSwing}</label>
              <div class="mini-bar"><span style="width:${(item.eloSwing / 3342) * 100}%"></span></div>
            </div>
            <div>
              <label>${upsetsCopy.avgGoals}</label>
              <div class="mini-bar"><span style="width:${(item.avgGoals / 5.38) * 100}%"></span></div>
            </div>
            <div>
              <label>${upsetsCopy.avgUpsetGap}</label>
              <div class="mini-bar"><span style="width:${(item.avgUpsetGap / 169.6) * 100}%"></span></div>
            </div>
          </div>
          <p>${upsetsCopy.avgGoalsValue} ${item.avgGoals} · ${upsetsCopy.avgGapValue} ${item.avgUpsetGap}</p>
        </article>
      `
    )
    .join("");

  championStrengthNode.innerHTML = renderStoryRows(championStrength, (item, index) => ({
    lead: index + 1,
    title: `${item.year} ${displayTeam(item.champion)}`,
    copy: `${upsetsCopy.defeatedAvg} ${item.avgDefeatedElo} · ${upsetsCopy.oppAvg} ${item.avgOppElo}`,
  }));

  neverChampionsNode.innerHTML = renderStoryRows(bestNeverChampions, (item, index) => ({
    lead: index + 1,
    title: displayTeam(item.team),
    copy: `${upsetsCopy.peakElo} ${item.peakElo} · ${upsetsCopy.avgElo} ${item.avgElo} · ${item.matches} ${upsetsCopy.matches}`,
  }));

  collapseNode.innerHTML = renderStoryRows(collapseRankings, (item, index) => ({
    lead: index + 1,
    title: `${item.year} ${displayTeam(item.team)}`,
    copy: `${displayCollapseRecord(item.record)} · ${upsetsCopy.peakElo} ${item.peakBefore} · ${upsetsCopy.upsetLosses} ${item.upsetLosses} · ${upsetsCopy.eloDrop} ${item.eloDrop} · ${displayCollapseNote(item)}`,
  }));

  setupCollapsibleSection(upsetsNode, { collapsedHeight: 520, itemLabel: upsetsCopy.upsetsLabel });
  setupCollapsibleSection(shocksNode, { collapsedHeight: 520, itemLabel: upsetsCopy.shocksLabel });
  setupCollapsibleSection(championStrengthNode, { collapsedHeight: 420, itemLabel: upsetsCopy.championLabel });
  setupCollapsibleSection(neverChampionsNode, { collapsedHeight: 420, itemLabel: upsetsCopy.neverLabel });
  setupCollapsibleSection(collapseNode, { collapsedHeight: 420, itemLabel: upsetsCopy.collapseLabel });
}

function initHistoryArchivePage() {
  const archiveOverviewNode = document.querySelector("#archive-overview");
  const archiveSummaryStripNode = document.querySelector("#archive-summary-strip");
  const archiveHostSummaryNode = document.querySelector("#archive-host-summary");
  const archiveHostsNode = document.querySelector("#archive-hosts");
  const hostSummaryNoteNode = document.querySelector("#host-summary-note");
  const archiveFormatNode = document.querySelector("#archive-format");
  const formatSummaryNoteNode = document.querySelector("#format-summary-note");
  const archiveVenuesNode = document.querySelector("#archive-venues");
  const archiveDynastiesNode = document.querySelector("#archive-dynasties");
  const archivePodiumNode = document.querySelector("#archive-podium");
  const archiveConfederationsNode = document.querySelector("#archive-confederations");
  const archiveStageEvolutionNode = document.querySelector("#archive-stage-evolution");
  const archiveGroupsNode = document.querySelector("#archive-groups");
  const archiveSubsNode = document.querySelector("#archive-subs");

  if (
    !archiveOverviewNode ||
    !archiveSummaryStripNode ||
    !archiveHostSummaryNode ||
    !archiveHostsNode ||
    !hostSummaryNoteNode ||
    !archiveFormatNode ||
    !formatSummaryNoteNode ||
    !archiveVenuesNode ||
    !archiveDynastiesNode ||
    !archivePodiumNode ||
    !archiveConfederationsNode ||
    !archiveStageEvolutionNode ||
    !archiveGroupsNode ||
    !archiveSubsNode
  ) {
    return;
  }

  const archiveCopy = currentLocale === "zh"
    ? {
        summaryStrip: [
          {
            title: "结构层",
            copy: "这里不讲 ELO 冷门，只讲比赛系统本身是怎么搭出来的。",
          },
          {
            title: "地理层",
            copy: "主办国、球场和城市共同定义了世界杯几十年的空间分布。",
          },
          {
            title: "赛制层",
            copy: "从 13 队到 32 队，世界杯其实经历了多次非常明显的结构转折。",
          },
        ],
        hostNote:
          "结论先看：22 届里有 6 次东道主夺冠，但更多主办国最终止步八强附近，主场优势重要，却不是万能护身符。",
        formatNote:
          "结论先看：1974、1978、1982 的赛制最异于常态，而 1998 之后的 32 队结构才是今天球迷最熟悉的版本。",
        directChampion: "东道主直接夺冠",
        groups: "个小组",
        groupRounds: "段小组赛",
        knockouts: "段淘汰赛",
        venueLede: "出现最多的城市、球场和主办国，能直接看出世界杯的地理重心。",
        hostMatches: "承办场次",
        cityTop: "城市 Top 8",
        venueTop: "球场 Top 8",
        matches: "场世界杯比赛",
        podiumTitle: "领奖台次数",
        topFour: "次前四",
        titles: "冠",
        runnersUp: "亚",
        thirds: "季",
        teamsReached: "支球队曾参赛",
        appearances: "次晋级届次",
        tournamentMatches: "场世界杯比赛",
        structure: "赛制结构",
        teams: "队",
        strongestGroup: "最强小组赛统治力",
        points: "分",
        goalDiff: "净胜球",
        goalsFor: "进球",
        subsEra: "换人时代",
        subEvents: "次换人事件",
        perMatch: "场均",
        hostsLabel: "主办国列表",
        formatLabel: "赛制演化",
        dynastiesLabel: "王朝球队",
        confedLabel: "洲际版图",
        stagesLabel: "阶段演化",
        groupsLabel: "小组统治力",
      }
    : {
        summaryStrip: [
          {
            title: "Structure",
            copy: "This page is not about Elo shocks. It explains how the tournament system itself was built.",
          },
          {
            title: "Geography",
            copy: "Hosts, stadiums, and cities define the spatial footprint of the World Cup across decades.",
          },
          {
            title: "Format",
            copy: "From 13 teams to 32, the tournament has gone through several clear structural turns.",
          },
        ],
        hostNote:
          "Start here: six host nations won the title, but most hosts still finished closer to the quarter-final line than to the trophy.",
        formatNote:
          "Start here: 1974, 1978, and 1982 were the real format outliers, while the 32-team era after 1998 is the structure most fans now recognise.",
        directChampion: "host won the title",
        groups: "groups",
        groupRounds: "group phases",
        knockouts: "knockout phases",
        venueLede: "The most-used cities, stadiums, and host countries reveal the tournament’s geographic centre of gravity.",
        hostMatches: "matches hosted",
        cityTop: "Top 8 cities",
        venueTop: "Top 8 stadiums",
        matches: "World Cup matches",
        podiumTitle: "Podium finishes",
        topFour: "top-four finishes",
        titles: "titles",
        runnersUp: "runners-up",
        thirds: "third places",
        teamsReached: "teams reached the finals",
        appearances: "advancing appearances",
        tournamentMatches: "World Cup matches",
        structure: "tournament structure",
        teams: "teams",
        strongestGroup: "Best group-stage dominance",
        points: "pts",
        goalDiff: "GD",
        goalsFor: "GF",
        subsEra: "Substitution era",
        subEvents: "substitution events",
        perMatch: "per match",
        hostsLabel: "host archive",
        formatLabel: "format evolution",
        dynastiesLabel: "dynasties",
        confedLabel: "confederation map",
        stagesLabel: "stage evolution",
        groupsLabel: "group dominance",
      };

  archiveOverviewNode.innerHTML = archiveOverview
    .map((item, index) => {
      const localized = localizeArchiveOverview(item, index);
      return `
        <article class="history-stat">
          <span class="history-stat__label">${localized.label}</span>
          <strong>${localized.value || item.value}</strong>
          <p>${localized.detail}</p>
        </article>
      `;
    })
    .join("");

  archiveSummaryStripNode.innerHTML = `
    <article class="summary-pill">
      <strong>${archiveCopy.summaryStrip[0].title}</strong>
      <span>${archiveCopy.summaryStrip[0].copy}</span>
    </article>
    <article class="summary-pill">
      <strong>${archiveCopy.summaryStrip[1].title}</strong>
      <span>${archiveCopy.summaryStrip[1].copy}</span>
    </article>
    <article class="summary-pill">
      <strong>${archiveCopy.summaryStrip[2].title}</strong>
      <span>${archiveCopy.summaryStrip[2].copy}</span>
    </article>
  `;

  hostSummaryNoteNode.textContent = archiveCopy.hostNote;
  formatSummaryNoteNode.textContent = archiveCopy.formatNote;

  archiveHostSummaryNode.innerHTML = renderArchiveChips(archiveHostSummary, (item) => ({
    value: item.value,
    label: item.label,
  }));

  archiveHostsNode.innerHTML = renderStoryRows(archiveHostStory, (item, index) => ({
    lead: index + 1,
    title: `${item.year} ${displayTeam(item.host)}`,
    copy: currentLocale === "zh"
      ? `${item.performance} · 冠军 ${displayTeam(item.winner)}${item.hostWon ? ` · ${archiveCopy.directChampion}` : ""}`
      : `${item.performance} · winner ${displayTeam(item.winner)}${item.hostWon ? ` · ${archiveCopy.directChampion}` : ""}`,
  }));

  archiveFormatNode.innerHTML = renderStoryRows(archiveFormatEvolution, (item) => ({
    lead: item.teams,
    metric: true,
    title: `${item.year} · ${displayTeam(item.hosts)}`,
    copy: `${item.groups} ${archiveCopy.groups} / ${item.groupStages} ${archiveCopy.groupRounds} / ${item.knockoutStages} ${archiveCopy.knockouts} · ${displayArchiveFormat(item.format)}`,
  }));

  archiveVenuesNode.innerHTML = `
    <div class="story-lede">${archiveCopy.venueLede}</div>
    ${renderArchiveChips(archiveVenueAtlas.hosts, (item) => ({
      value: item.matches,
      label: `${displayTeam(item.country)} ${archiveCopy.hostMatches}`,
    }))}
    <div class="archive-subpanel">
      <h3>${archiveCopy.cityTop}</h3>
      ${renderStoryRows(archiveVenueAtlas.cities, (item, index) => ({
        lead: index + 1,
        title: `${displayVenue(item.city)}, ${displayTeam(item.country)}`,
        copy: `${item.matches} ${archiveCopy.matches}`,
      }))}
    </div>
    <div class="archive-subpanel">
      <h3>${archiveCopy.venueTop}</h3>
      ${renderStoryRows(archiveVenueAtlas.stadiums, (item, index) => ({
        lead: index + 1,
        title: displayVenue(item.stadium),
        copy: currentLocale === "zh"
          ? `${displayVenue(item.city)}, ${displayTeam(item.country)} · ${item.matches} 场`
          : `${displayVenue(item.city)}, ${displayTeam(item.country)} · ${item.matches} matches`,
      }))}
    </div>
  `;

  archiveDynastiesNode.innerHTML = renderStoryRows(archiveTeamDynasties, (item, index) => ({
    lead: index + 1,
    title: displayTeam(item.team),
    copy: currentLocale === "zh"
      ? `${item.titles} 冠 · ${item.topFour} 次四强 · ${item.appearances} 次参赛 · ${item.matches} 场 / ${item.wins} 胜`
      : `${item.titles} titles · ${item.topFour} top-four finishes · ${item.appearances} appearances · ${item.matches} matches / ${item.wins} wins`,
  }));

  archivePodiumNode.innerHTML = `
    <h3>${archiveCopy.podiumTitle}</h3>
    ${renderStoryRows(archivePodiumMap, (item, index) => ({
      lead: index + 1,
      title: displayTeam(item.team),
      copy: currentLocale === "zh"
        ? `${item.topFour} 次前四 · ${item.titles} 冠 / ${item.runnersUp} 亚 / ${item.thirds} 季`
        : `${item.topFour} ${archiveCopy.topFour} · ${item.titles} ${archiveCopy.titles} / ${item.runnersUp} ${archiveCopy.runnersUp} / ${item.thirds} ${archiveCopy.thirds}`,
    }))}
  `;

  archiveConfederationsNode.innerHTML = renderStoryRows(archiveConfederationReach, (item, index) => ({
    lead: index + 1,
    title: `${item.confederation} · ${item.name}`,
    copy: currentLocale === "zh"
      ? `${item.teams} 支球队曾参赛 · ${item.appearances} 次晋级届次 · ${item.matches} 场世界杯比赛`
      : `${item.teams} ${archiveCopy.teamsReached} · ${item.appearances} ${archiveCopy.appearances} · ${item.matches} ${archiveCopy.tournamentMatches}`,
  }));

  archiveStageEvolutionNode.innerHTML = renderStoryRows(archiveStageEvolution, (item) => ({
    lead: item.stages,
    metric: true,
    title: currentLocale === "zh" ? `${item.year} ${archiveCopy.structure}` : `${item.year} ${archiveCopy.structure}`,
    copy: `${item.teams} ${archiveCopy.teams} · ${item.groups} ${archiveCopy.groups} · ${item.groupStages} ${archiveCopy.groupRounds} / ${item.knockoutStages} ${archiveCopy.knockouts}`,
  }));

  archiveGroupsNode.innerHTML = `
    <h3>${archiveCopy.strongestGroup}</h3>
    ${renderStoryRows(archiveGroupDominance, (item) => ({
      lead: item.points,
      metric: true,
      title: `${item.year} · ${displayTeam(item.team)} · ${item.group}`,
      copy: `${item.points} ${archiveCopy.points} · ${archiveCopy.goalDiff} ${item.goalDiff} · ${archiveCopy.goalsFor} ${item.goalsFor}`,
    }))}
  `;

  archiveSubsNode.innerHTML = `
    <h3>${archiveCopy.subsEra}</h3>
    ${renderStoryRows(archiveSubstitutionEras.slice(-8).reverse(), (item) => ({
      lead: item.perMatch,
      metric: true,
      title: currentLocale === "zh" ? `${item.year} 世界杯` : `${item.year} World Cup`,
      copy: `${item.subs} ${archiveCopy.subEvents} · ${archiveCopy.perMatch} ${item.perMatch}`,
    }))}
  `;

  setupCollapsibleSection(archiveHostsNode, { collapsedHeight: 500, itemLabel: archiveCopy.hostsLabel });
  setupCollapsibleSection(archiveFormatNode, { collapsedHeight: 500, itemLabel: archiveCopy.formatLabel });
  setupCollapsibleSection(archiveDynastiesNode, { collapsedHeight: 420, itemLabel: archiveCopy.dynastiesLabel });
  setupCollapsibleSection(archiveConfederationsNode, { collapsedHeight: 360, itemLabel: archiveCopy.confedLabel });
  setupCollapsibleSection(archiveStageEvolutionNode, { collapsedHeight: 420, itemLabel: archiveCopy.stagesLabel });
  setupCollapsibleSection(archiveGroupsNode, { collapsedHeight: 320, itemLabel: archiveCopy.groupsLabel });
}

function initHistoryPlayersPage() {
  const archiveScorersNode = document.querySelector("#archive-scorers");
  const playerSummaryNoteNode = document.querySelector("#player-summary-note");
  const archiveAppearancesNode = document.querySelector("#archive-appearances");
  const archiveEvergreensNode = document.querySelector("#archive-evergreens");
  const archiveAwardLeadersNode = document.querySelector("#archive-award-leaders");
  const archiveAwardsNode = document.querySelector("#archive-awards");
  const archiveManagersNode = document.querySelector("#archive-managers");
  const archiveRefereesNode = document.querySelector("#archive-referees");

  if (
    !archiveScorersNode ||
    !playerSummaryNoteNode ||
    !archiveAppearancesNode ||
    !archiveEvergreensNode ||
    !archiveAwardLeadersNode ||
    !archiveAwardsNode ||
    !archiveManagersNode ||
    !archiveRefereesNode
  ) {
    return;
  }

  const playersCopy = currentLocale === "zh"
    ? {
        summary: `结论先看：射手榜顶端是 ${formatPlayerInline(archiveTopScorers[0].player)} 的 ${archiveTopScorers[0].goals} 球，出场王是 ${formatPlayerInline(archiveTopAppearances[0].player)} 的 ${archiveTopAppearances[0].matches} 场。`,
        goals: "球",
        tournaments: "届世界杯",
        appearancesTitle: "出场王",
        appearances: "场",
        evergreensTitle: "阵容常青树",
        squads: "届入选大名单",
        position: "主位置",
        awardLeaderCount: "次个人奖项",
        awardsTitle: "奖项谱系",
        introduced: "年引入",
        managerCopy: "场执教 · %TOURNAMENTS% 届世界杯 · 带过 %TEAMS% 支球队",
        refereeTitle: "执法场次 Top 10",
        refereeCopy: "%TOURNAMENTS% 届世界杯 · %CONFEDERATION%",
        scorersLabel: "射手榜",
        appearancesLabel: "出场王",
        evergreenLabel: "常青树",
        awardLabel: "奖项领跑者",
        managersLabel: "主帅榜",
      }
    : {
        summary: `Start here: ${archiveTopScorers[0].player} leads the scoring table with ${archiveTopScorers[0].goals} goals, while ${archiveTopAppearances[0].player} holds the appearance record with ${archiveTopAppearances[0].matches} matches.`,
        goals: "goals",
        tournaments: "World Cups",
        appearancesTitle: "Most appearances",
        appearances: "matches",
        evergreensTitle: "Squad evergreens",
        squads: "tournament squads",
        position: "Position",
        awardLeaderCount: "individual awards",
        awardsTitle: "Awards map",
        introduced: "introduced",
        managerCopy: "%MATCHES% matches coached · %TOURNAMENTS% World Cups · %TEAMS% national teams",
        refereeTitle: "Top 10 referees by matches",
        refereeCopy: "%TOURNAMENTS% World Cups · %CONFEDERATION%",
        scorersLabel: "scorers",
        appearancesLabel: "appearance leaders",
        evergreenLabel: "evergreens",
        awardLabel: "award leaders",
        managersLabel: "managers",
      };

  playerSummaryNoteNode.innerHTML = playersCopy.summary;

  archiveScorersNode.innerHTML = renderStoryRows(archiveTopScorers, (item) => ({
    lead: item.goals,
    metric: true,
    title: `${formatPlayerTitle(item.player)} · ${displayTeam(item.team)}`,
    copy: `${item.goals} ${playersCopy.goals} · ${item.tournaments} ${playersCopy.tournaments}`,
  }));

  archiveAppearancesNode.innerHTML = `
    <h3>${playersCopy.appearancesTitle}</h3>
    ${renderStoryRows(archiveTopAppearances, (item) => ({
      lead: item.matches,
      metric: true,
      title: `${formatPlayerTitle(item.player)} · ${displayTeam(item.team)}`,
      copy: `${item.matches} ${playersCopy.appearances} · ${item.tournaments} ${playersCopy.tournaments}`,
    }))}
  `;

  archiveEvergreensNode.innerHTML = `
    <h3>${playersCopy.evergreensTitle}</h3>
    ${renderStoryRows(archiveSquadEvergreens, (item) => ({
      lead: item.tournaments,
      metric: true,
      title: `${formatPlayerTitle(item.player)} · ${displayTeam(item.team)}`,
      copy: `${item.tournaments} ${playersCopy.squads} · ${playersCopy.position} ${item.position}`,
    }))}
  `;

  archiveAwardLeadersNode.innerHTML = renderStoryRows(archiveAwardLeaders, (item) => ({
    lead: item.awards,
    metric: true,
    title: `${formatPlayerTitle(item.player)} · ${displayTeam(item.team)}`,
    copy: `${item.awards} ${playersCopy.awardLeaderCount} · ${item.highlights.join(" / ")}`,
  }));

  archiveAwardsNode.innerHTML = `
    <h3>${playersCopy.awardsTitle}</h3>
    ${renderStoryRows(archiveAwards, (item) => ({
      lead: item.winners,
      metric: true,
      title: item.award,
      copy: currentLocale === "zh"
        ? `${item.introduced} ${playersCopy.introduced} · ${item.description}`
        : `${playersCopy.introduced} ${item.introduced} · ${item.description}`,
    }))}
  `;

  archiveManagersNode.innerHTML = renderStoryRows(archiveManagerLegends, (item) => ({
    lead: item.matches,
    metric: true,
    title: `${item.manager} · ${displayTeam(item.country)}`,
    copy: playersCopy.managerCopy
      .replace("%MATCHES%", item.matches)
      .replace("%TOURNAMENTS%", item.tournaments)
      .replace("%TEAMS%", item.teams),
  }));

  archiveRefereesNode.innerHTML = `
    <h3>${playersCopy.refereeTitle}</h3>
    ${renderStoryRows(archiveRefereeLegends, (item) => ({
      lead: item.matches,
      metric: true,
      title: `${item.referee} · ${displayTeam(item.country)}`,
      copy: playersCopy.refereeCopy
        .replace("%TOURNAMENTS%", item.tournaments)
        .replace("%CONFEDERATION%", item.confederation),
    }))}
  `;

  setupCollapsibleSection(archiveScorersNode, { collapsedHeight: 500, itemLabel: playersCopy.scorersLabel });
  setupCollapsibleSection(archiveAppearancesNode, { collapsedHeight: 360, itemLabel: playersCopy.appearancesLabel });
  setupCollapsibleSection(archiveEvergreensNode, { collapsedHeight: 360, itemLabel: playersCopy.evergreenLabel });
  setupCollapsibleSection(archiveAwardLeadersNode, { collapsedHeight: 360, itemLabel: playersCopy.awardLabel });
  setupCollapsibleSection(archiveManagersNode, { collapsedHeight: 360, itemLabel: playersCopy.managersLabel });
}

function initHistoryMatchesPage() {
  const timelineNode = document.querySelector("#history-timeline");
  const archiveGoalTournamentsNode = document.querySelector("#archive-goal-tournaments");
  const eventSummaryNoteNode = document.querySelector("#event-summary-note");
  const archiveMilestoneGoalsNode = document.querySelector("#archive-milestone-goals");
  const archiveShootoutsNode = document.querySelector("#archive-shootouts");
  const archiveCardsNode = document.querySelector("#archive-cards");

  if (
    !timelineNode ||
    !archiveGoalTournamentsNode ||
    !eventSummaryNoteNode ||
    !archiveMilestoneGoalsNode ||
    !archiveShootoutsNode ||
    !archiveCardsNode
  ) {
    return;
  }

  const matchesCopy = currentLocale === "zh"
    ? {
        timelineTag: (item) => `${item.matches} 场 · ${item.goals} 球`,
        championYear: (item) => `${item.champion} 冠军年`,
        goals: "球",
        matches: "场",
        milestoneTitle: "最早与最晚进球",
        shootout: "点球大战",
        cards: "总牌数",
        reds: "罚下",
        summary: `结论先看：进球最多的是 ${archiveGoalTournaments[0].year} 年的 ${archiveGoalTournaments[0].goals} 球，换人密度最高的则是 ${archiveSubstitutionEras[archiveSubstitutionEras.length - 1].year} 年。`,
        timelineLabel: "冠军时间线",
        shootoutsLabel: "点球大战",
        cardsLabel: "纪律名场面",
      }
    : {
        timelineTag: (item) => `${item.matches} matches · ${item.goals} goals`,
        championYear: (item) => `${item.champion} title year`,
        goals: "goals",
        matches: "matches",
        milestoneTitle: "Earliest and latest goals",
        shootout: "shootout",
        cards: "cards",
        reds: "reds",
        summary: `Start here: ${archiveGoalTournaments[0].year} produced the highest goal total with ${archiveGoalTournaments[0].goals}, while substitution density peaked in ${archiveSubstitutionEras[archiveSubstitutionEras.length - 1].year}.`,
        timelineLabel: "champion timeline",
        shootoutsLabel: "shootouts",
        cardsLabel: "card-heavy matches",
      };

  timelineNode.innerHTML = historyTimeline
    .map(
      (item) => `
        <article class="timeline-card">
          <div class="timeline-card__year">${item.year}</div>
          <div class="timeline-card__body">
            <p class="story-card__tag">${matchesCopy.timelineTag(item)}</p>
            <h3>${currentLocale === "zh" ? `${displayTeam(item.champion)} 冠军年` : `${displayTeam(item.champion)} title year`}</h3>
            <p>${displayTeam(item.champion)} ${displayScore(item.score)} ${displayTeam(item.runnerUp)}</p>
            <p>${displayTimelineNote(item)}</p>
          </div>
        </article>
      `
    )
    .join("");

  archiveGoalTournamentsNode.innerHTML = renderStoryRows(archiveGoalTournaments, (item) => ({
    lead: item.goals,
    metric: true,
    title: currentLocale === "zh" ? `${item.year} 世界杯` : `${item.year} World Cup`,
    copy: `${item.goals} ${matchesCopy.goals} · ${item.matches} ${matchesCopy.matches}`,
  }));

  archiveMilestoneGoalsNode.innerHTML = `
    <h3>${matchesCopy.milestoneTitle}</h3>
    ${renderStoryRows(archiveMilestoneGoals.earliest, (item) => ({
      lead: item.label,
      metric: true,
      title: `${item.year} · ${item.player}`,
      copy: item.match,
    }))}
    ${renderStoryRows(archiveMilestoneGoals.latest, (item) => ({
      lead: item.label,
      metric: true,
      title: `${item.year} · ${item.player}`,
      copy: item.match,
    }))}
  `;

  archiveShootoutsNode.innerHTML = renderStoryRows(archiveShootoutMatches, (item) => ({
    lead: item.score,
    metric: true,
    title: `${item.year} · ${item.match}`,
    copy: `${item.stage} ${matchesCopy.shootout}`,
  }));

  archiveCardsNode.innerHTML = renderStoryRows(archiveCardHeavyMatches, (item) => ({
    lead: item.cards,
    metric: true,
    title: `${item.year} · ${item.match}`,
    copy: `${item.stage} · ${matchesCopy.cards} ${item.cards} · ${matchesCopy.reds} ${item.reds}`,
  }));

  eventSummaryNoteNode.textContent = matchesCopy.summary;

  setupCollapsibleSection(timelineNode, { collapsedHeight: 560, itemLabel: matchesCopy.timelineLabel });
  setupCollapsibleSection(archiveShootoutsNode, { collapsedHeight: 360, itemLabel: matchesCopy.shootoutsLabel });
  setupCollapsibleSection(archiveCardsNode, { collapsedHeight: 360, itemLabel: matchesCopy.cardsLabel });

  initHistoryExplorer();
}

function initHistoryPage() {
  const overviewNode = document.querySelector("#history-overview");
  const archiveOverviewNode = document.querySelector("#archive-overview");
  const archiveSummaryStripNode = document.querySelector("#archive-summary-strip");
  const archiveHostSummaryNode = document.querySelector("#archive-host-summary");
  const archiveHostsNode = document.querySelector("#archive-hosts");
  const hostSummaryNoteNode = document.querySelector("#host-summary-note");
  const archiveFormatNode = document.querySelector("#archive-format");
  const formatSummaryNoteNode = document.querySelector("#format-summary-note");
  const archiveVenuesNode = document.querySelector("#archive-venues");
  const archiveDynastiesNode = document.querySelector("#archive-dynasties");
  const archivePodiumNode = document.querySelector("#archive-podium");
  const archiveConfederationsNode = document.querySelector("#archive-confederations");
  const timelineNode = document.querySelector("#history-timeline");
  const upsetsNode = document.querySelector("#history-upsets");
  const upsetSummaryNoteNode = document.querySelector("#upset-summary-note");
  const shocksNode = document.querySelector("#history-shocks");
  const shockSummaryNoteNode = document.querySelector("#shock-summary-note");
  const archiveScorersNode = document.querySelector("#archive-scorers");
  const playerSummaryNoteNode = document.querySelector("#player-summary-note");
  const archiveAppearancesNode = document.querySelector("#archive-appearances");
  const archiveEvergreensNode = document.querySelector("#archive-evergreens");
  const archiveAwardLeadersNode = document.querySelector("#archive-award-leaders");
  const archiveAwardsNode = document.querySelector("#archive-awards");
  const archiveManagersNode = document.querySelector("#archive-managers");
  const archiveRefereesNode = document.querySelector("#archive-referees");
  const chaosNode = document.querySelector("#history-chaos");
  const archiveGoalTournamentsNode = document.querySelector("#archive-goal-tournaments");
  const eventSummaryNoteNode = document.querySelector("#event-summary-note");
  const archiveMilestoneGoalsNode = document.querySelector("#archive-milestone-goals");
  const archiveShootoutsNode = document.querySelector("#archive-shootouts");
  const archiveCardsNode = document.querySelector("#archive-cards");
  const archiveStageEvolutionNode = document.querySelector("#archive-stage-evolution");
  const archiveGroupsNode = document.querySelector("#archive-groups");
  const archiveSubsNode = document.querySelector("#archive-subs");
  const chartChampionsNode = document.querySelector("#history-chart-champions");
  const chartFormatNode = document.querySelector("#history-chart-format");
  const chartConfederationsNode = document.querySelector("#history-chart-confederations");
  const chartGoalsNode = document.querySelector("#history-chart-goals");
  const chartSubsNode = document.querySelector("#history-chart-subs");
  const chartHostsNode = document.querySelector("#history-chart-hosts");
  const backToTopButton = document.querySelector("#back-to-top");
  const championStrengthNode = document.querySelector("#champion-strength");
  const championSummaryNoteNode = document.querySelector("#champion-summary-note");
  const neverChampionsNode = document.querySelector("#never-champions");
  const neverSummaryNoteNode = document.querySelector("#never-summary-note");
  const collapseNode = document.querySelector("#collapse-rankings");
  const collapseSummaryNoteNode = document.querySelector("#collapse-summary-note");
  const teamSelect = document.querySelector("#history-team-select");
  const teamProfileNode = document.querySelector("#history-team-profile");

  if (
    !overviewNode ||
    !archiveOverviewNode ||
    !archiveSummaryStripNode ||
    !archiveHostSummaryNode ||
    !hostSummaryNoteNode ||
    !archiveHostsNode ||
    !archiveFormatNode ||
    !formatSummaryNoteNode ||
    !archiveVenuesNode ||
    !archiveDynastiesNode ||
    !archivePodiumNode ||
    !archiveConfederationsNode ||
    !timelineNode ||
    !upsetsNode ||
    !upsetSummaryNoteNode ||
    !shocksNode ||
    !shockSummaryNoteNode ||
    !archiveScorersNode ||
    !playerSummaryNoteNode ||
    !archiveAppearancesNode ||
    !archiveEvergreensNode ||
    !archiveAwardLeadersNode ||
    !archiveAwardsNode ||
    !archiveManagersNode ||
    !archiveRefereesNode ||
    !chaosNode ||
    !archiveGoalTournamentsNode ||
    !eventSummaryNoteNode ||
    !archiveMilestoneGoalsNode ||
    !archiveShootoutsNode ||
    !archiveCardsNode ||
    !archiveStageEvolutionNode ||
    !archiveGroupsNode ||
    !archiveSubsNode ||
    !chartChampionsNode ||
    !chartFormatNode ||
    !chartConfederationsNode ||
    !chartGoalsNode ||
    !chartSubsNode ||
    !chartHostsNode ||
    !backToTopButton ||
    !championStrengthNode ||
    !championSummaryNoteNode ||
    !neverChampionsNode ||
    !neverSummaryNoteNode ||
    !collapseNode ||
    !collapseSummaryNoteNode ||
    !teamSelect ||
    !teamProfileNode
  ) {
    return;
  }

  overviewNode.innerHTML = historyOverview
    .map(
      (item) => `
        <article class="history-stat">
          <span class="history-stat__label">${item.label}</span>
          <strong>${item.value}</strong>
          <p>${item.detail}</p>
        </article>
      `
    )
    .join("");

  archiveOverviewNode.innerHTML = archiveOverview
    .map(
      (item) => `
        <article class="history-stat">
          <span class="history-stat__label">${item.label}</span>
          <strong>${item.value}</strong>
          <p>${item.detail}</p>
        </article>
      `
    )
    .join("");

  archiveSummaryStripNode.innerHTML =
    currentLocale === "zh"
      ? `
        <article class="summary-pill">
          <strong>资料库骨架</strong>
          <span>27 个数据集把比赛、球员、主帅、裁判、事件和排名全部补齐。</span>
        </article>
        <article class="summary-pill">
          <strong>历史跨度</strong>
          <span>22 届、964 场、13302 条事件，足够支撑长期专题和后续球队页扩展。</span>
        </article>
        <article class="summary-pill">
          <strong>分层策略</strong>
          <span>这页现在是 worldcup 事实层 + ELO 分析层的联合展示。</span>
        </article>
      `
      : `
        <article class="summary-pill">
          <strong>Archive backbone</strong>
          <span>27 datasets now cover matches, players, managers, referees, events, and standings in one place.</span>
        </article>
        <article class="summary-pill">
          <strong>Historical span</strong>
          <span>22 tournaments, 964 matches, and 13,302 event records are enough to support long-form features and future team pages.</span>
        </article>
        <article class="summary-pill">
          <strong>Layer strategy</strong>
          <span>This page now combines the factual worldcup archive with the Elo analysis layer.</span>
        </article>
      `;

  hostSummaryNoteNode.textContent =
    currentLocale === "zh"
      ? "结论先看：22 届里有 6 次东道主直接夺冠，但更多主办国实际只能走到八强附近，主场优势很强，但远没有强到稳定保冠。"
      : "Start here: hosts won the title 6 times across 22 tournaments, but most host nations still stopped closer to the quarter-final range than to the trophy.";

  formatSummaryNoteNode.textContent =
    currentLocale === "zh"
      ? "结论先看：世界杯赛制经历了 13 队、16 队、24 队到 32 队的四次主形态变化，1974、1978、1982 的双阶段结构最不一样。"
      : "Start here: the World Cup moved through four main formats from 13 teams to 32 teams, with 1974, 1978, and 1982 standing out for their two-stage group structures.";

  archiveHostSummaryNode.innerHTML = renderArchiveChips(archiveHostSummary, (item) => ({
    value: item.value,
    label: item.label,
  }));

  archiveHostsNode.innerHTML = renderStoryRows(archiveHostStory, (item, index) => ({
    lead: index + 1,
    title: `${item.year} ${item.host}`,
    copy:
      currentLocale === "zh"
        ? `${item.performance} · 冠军 ${item.winner}${item.hostWon ? " · 东道主直接夺冠" : ""}`
        : `${item.performance} · Champion ${displayTeam(item.winner)}${item.hostWon ? " · Host won the title" : ""}`,
  }));

  archiveFormatNode.innerHTML = renderStoryRows(archiveFormatEvolution, (item) => ({
    lead: item.teams,
    metric: true,
    title: `${item.year} · ${item.hosts}`,
    copy:
      currentLocale === "zh"
        ? `${item.groups} 个小组 / ${item.groupStages} 段小组赛 / ${item.knockoutStages} 段淘汰赛 · ${item.format}`
        : `${item.groups} groups / ${item.groupStages} group stage blocks / ${item.knockoutStages} knockout blocks · ${displayArchiveFormat(item.format)}`,
  }));

  archiveVenuesNode.innerHTML = `
    <div class="story-lede">${currentLocale === "zh" ? "出现最多的城市、球场和主办国，能直接看出世界杯的地理重心。" : "The most-used host countries, cities, and stadiums show the geographic center of gravity of the tournament immediately."}</div>
    ${renderArchiveChips(archiveVenueAtlas.hosts, (item) => ({
      value: item.matches,
      label: currentLocale === "zh" ? `${item.country} 承办场次` : `${displayTeam(item.country)} hosted matches`,
    }))}
    <div class="archive-subpanel">
      <h3>${currentLocale === "zh" ? "城市 Top 8" : "Top 8 cities"}</h3>
      ${renderStoryRows(archiveVenueAtlas.cities, (item, index) => ({
        lead: index + 1,
        title: `${displayVenue(item.city)}, ${displayTeam(item.country)}`,
        copy: currentLocale === "zh" ? `${item.matches} 场世界杯比赛` : `${item.matches} World Cup matches`,
      }))}
    </div>
    <div class="archive-subpanel">
      <h3>${currentLocale === "zh" ? "球场 Top 8" : "Top 8 stadiums"}</h3>
      ${renderStoryRows(archiveVenueAtlas.stadiums, (item, index) => ({
        lead: index + 1,
        title: item.stadium,
        copy:
          currentLocale === "zh"
            ? `${item.city}, ${item.country} · ${item.matches} 场`
            : `${displayVenue(item.city)}, ${displayTeam(item.country)} · ${item.matches} matches`,
      }))}
    </div>
  `;

  archiveDynastiesNode.innerHTML = renderStoryRows(archiveTeamDynasties, (item, index) => ({
    lead: index + 1,
    title: displayTeam(item.team),
    copy:
      currentLocale === "zh"
        ? `${item.titles} 冠 · ${item.topFour} 次四强 · ${item.appearances} 次参赛 · ${item.matches} 场 / ${item.wins} 胜`
        : `${item.titles} titles · ${item.topFour} top-four finishes · ${item.appearances} appearances · ${item.matches} matches / ${item.wins} wins`,
  }));

  archivePodiumNode.innerHTML = `
    <h3>${currentLocale === "zh" ? "领奖台次数" : "Podium finishes"}</h3>
    ${renderStoryRows(archivePodiumMap, (item, index) => ({
      lead: index + 1,
      title: displayTeam(item.team),
      copy:
        currentLocale === "zh"
          ? `${item.topFour} 次前四 · ${item.titles} 冠 / ${item.runnersUp} 亚 / ${item.thirds} 季`
          : `${item.topFour} top-four finishes · ${item.titles} titles / ${item.runnersUp} runners-up / ${item.thirds} third places`,
    }))}
  `;

  archiveConfederationsNode.innerHTML = renderStoryRows(
    archiveConfederationReach,
    (item, index) => ({
      lead: index + 1,
      title: `${item.confederation} · ${item.name}`,
      copy:
        currentLocale === "zh"
          ? `${item.teams} 支球队曾参赛 · ${item.appearances} 次晋级届次 · ${item.matches} 场世界杯比赛`
          : `${item.teams} teams have appeared · ${item.appearances} tournament appearances · ${item.matches} World Cup matches`,
    })
  );

  upsetSummaryNoteNode.textContent =
    currentLocale === "zh"
      ? `结论先看：这份 ELO 表里最极端的爆冷是 ${historyUpsets[0].winner} ${historyUpsets[0].score} ${historyUpsets[0].loser}，赛前强弱差达到 ${historyUpsets[0].eloGap}。`
      : `Start here: the biggest upset in this Elo dataset is ${displayTeam(historyUpsets[0].winner)} ${displayScore(historyUpsets[0].score)} ${displayTeam(historyUpsets[0].loser)}, with a pre-match gap of ${historyUpsets[0].eloGap}.`;

  shockSummaryNoteNode.textContent =
    currentLocale === "zh"
      ? `结论先看：单场 ELO 总波动最大的是 ${historyShocks[0].date} 的 ${historyShocks[0].home} ${historyShocks[0].score} ${historyShocks[0].away}，总震荡 ${historyShocks[0].swing}。`
      : `Start here: the biggest single-match Elo shock came in ${historyShocks[0].date}, when ${displayTeam(historyShocks[0].home)} ${displayScore(historyShocks[0].score)} ${displayTeam(historyShocks[0].away)} produced a total swing of ${historyShocks[0].swing}.`;

  timelineNode.innerHTML = historyTimeline
    .map(
      (item) => `
        <article class="timeline-card">
            <div class="timeline-card__year">${item.year}</div>
            <div class="timeline-card__body">
            <p class="story-card__tag">${currentLocale === "zh" ? `${item.matches} 场 · ${item.goals} 球` : `${item.matches} matches · ${item.goals} goals`}</p>
            <h3>${currentLocale === "zh" ? `${item.champion} 冠军年` : `${displayTeam(item.champion)} title year`}</h3>
            <p>${displayTeam(item.champion)} ${displayScore(item.score)} ${displayTeam(item.runnerUp)}</p>
            <p>${displayTimelineNote(item)}</p>
          </div>
        </article>
      `
    )
    .join("");

  archiveScorersNode.innerHTML = renderStoryRows(archiveTopScorers, (item, index) => ({
    lead: item.goals,
    metric: true,
    title: `${formatPlayerInline(item.player)} · ${displayTeam(item.team)}`,
    copy: currentLocale === "zh" ? `${item.goals} 球 · ${item.tournaments} 届世界杯` : `${item.goals} goals · ${item.tournaments} World Cups`,
  }));

  archiveAppearancesNode.innerHTML = `
    <h3>${currentLocale === "zh" ? "出场王" : "Appearance leaders"}</h3>
    ${renderStoryRows(archiveTopAppearances, (item, index) => ({
      lead: item.matches,
      metric: true,
      title: `${formatPlayerInline(item.player)} · ${displayTeam(item.team)}`,
      copy: currentLocale === "zh" ? `${item.matches} 场 · ${item.tournaments} 届` : `${item.matches} matches · ${item.tournaments} tournaments`,
    }))}
  `;

  archiveEvergreensNode.innerHTML = `
    <h3>${currentLocale === "zh" ? "阵容常青树" : "Squad evergreens"}</h3>
    ${renderStoryRows(archiveSquadEvergreens, (item, index) => ({
      lead: item.tournaments,
      metric: true,
      title: `${formatPlayerInline(item.player)} · ${displayTeam(item.team)}`,
      copy:
        currentLocale === "zh"
          ? `${item.tournaments} 届入选大名单 · 主位置 ${item.position}`
          : `${item.tournaments} squad selections · Primary role ${item.position}`,
    }))}
  `;

  playerSummaryNoteNode.textContent =
    currentLocale === "zh"
      ? `结论先看：射手榜顶端是 ${archiveTopScorers[0].player} 的 ${archiveTopScorers[0].goals} 球，出场王是 ${archiveTopAppearances[0].player} 的 ${archiveTopAppearances[0].matches} 场，世界杯人物层已经能单独撑起一套资料页。`
      : `Start here: the scoring table is led by ${formatPlayerInline(archiveTopScorers[0].player)} with ${archiveTopScorers[0].goals} goals, while the appearance chart is led by ${formatPlayerInline(archiveTopAppearances[0].player)} with ${archiveTopAppearances[0].matches} matches.`;

  archiveAwardLeadersNode.innerHTML = renderStoryRows(
    archiveAwardLeaders,
    (item, index) => ({
      lead: item.awards,
      metric: true,
      title: `${formatPlayerInline(item.player)} · ${displayTeam(item.team)}`,
      copy: currentLocale === "zh" ? `${item.awards} 次个人奖项 · ${item.highlights.join(" / ")}` : `${item.awards} individual awards · ${item.highlights.join(" / ")}`,
    })
  );

  archiveAwardsNode.innerHTML = `
    <h3>${currentLocale === "zh" ? "奖项谱系" : "Award lineage"}</h3>
    ${renderStoryRows(archiveAwards, (item, index) => ({
      lead: item.winners,
      metric: true,
      title: `${item.award}`,
      copy: currentLocale === "zh" ? `${item.introduced} 年引入 · ${item.description}` : `Introduced in ${item.introduced} · ${item.description}`,
    }))}
  `;

  archiveManagersNode.innerHTML = renderStoryRows(
    archiveManagerLegends,
    (item, index) => ({
      lead: item.matches,
      metric: true,
      title: `${item.manager} · ${displayTeam(item.country)}`,
      copy:
        currentLocale === "zh"
          ? `${item.matches} 场执教 · ${item.tournaments} 届世界杯 · 带过 ${item.teams} 支球队`
          : `${item.matches} matches coached · ${item.tournaments} World Cups · managed ${item.teams} teams`,
    })
  );

  archiveRefereesNode.innerHTML = `
    <h3>${currentLocale === "zh" ? "执法场次 Top 10" : "Top 10 referee workloads"}</h3>
    ${renderStoryRows(archiveRefereeLegends, (item, index) => ({
      lead: item.matches,
      metric: true,
      title: `${item.referee} · ${displayTeam(item.country)}`,
      copy: currentLocale === "zh" ? `${item.tournaments} 届世界杯 · ${item.confederation}` : `${item.tournaments} World Cups · ${item.confederation}`,
    }))}
  `;

  upsetsNode.innerHTML = historyUpsets
    .map(
      (item, index) => `
        <article class="story-row">
          <span class="story-row__index">${index + 1}</span>
          <div class="story-row__body">
            <strong>${displayTeam(item.winner)} ${displayScore(item.score)} ${displayTeam(item.loser)}</strong>
            <p>${item.date} · ${currentLocale === "zh" ? "冷门差值" : "Upset gap"} ${item.eloGap} · ${currentLocale === "zh" ? "赛前 ELO" : "Pre-match Elo"} ${item.winnerElo} vs ${item.loserElo}</p>
          </div>
        </article>
      `
    )
    .join("");

  shocksNode.innerHTML = historyShocks
    .map(
      (item) => `
        <article class="story-row">
          <span class="story-row__metric">${item.swing}</span>
          <div class="story-row__body">
            <strong>${displayTeam(item.home)} ${displayScore(item.score)} ${displayTeam(item.away)}</strong>
            <p>${item.date} · ${currentLocale === "zh" ? "赛前 ELO 差" : "Pre-match Elo gap"} ${item.preGap} · ${currentLocale === "zh" ? "单场总波动" : "Total match swing"} ${item.swing}</p>
          </div>
        </article>
      `
    )
    .join("");

  chaosNode.innerHTML = historyChaos
    .map(
      (item) => `
        <article class="chaos-card">
          <div class="chaos-card__top">
            <strong>${item.year}</strong>
            <span>${currentLocale === "zh" ? `${item.upsets} 次爆冷` : `${item.upsets} upsets`}</span>
          </div>
          <div class="chaos-card__bars">
            <div>
              <label>${currentLocale === "zh" ? "ELO 波动" : "Elo swing"}</label>
              <div class="mini-bar"><span style="width:${(item.eloSwing / 3342) * 100}%"></span></div>
            </div>
            <div>
              <label>${currentLocale === "zh" ? "平均进球" : "Average goals"}</label>
              <div class="mini-bar"><span style="width:${(item.avgGoals / 5.38) * 100}%"></span></div>
            </div>
            <div>
              <label>${currentLocale === "zh" ? "爆冷幅度" : "Upset severity"}</label>
              <div class="mini-bar"><span style="width:${(item.avgUpsetGap / 169.6) * 100}%"></span></div>
            </div>
          </div>
          <p>${currentLocale === "zh" ? "平均进球" : "Average goals"} ${item.avgGoals} · ${currentLocale === "zh" ? "平均冷门差值" : "Average upset gap"} ${item.avgUpsetGap}</p>
        </article>
      `
    )
    .join("");

  archiveGoalTournamentsNode.innerHTML = renderStoryRows(
    archiveGoalTournaments,
    (item, index) => ({
      lead: item.goals,
      metric: true,
      title: currentLocale === "zh" ? `${item.year} 世界杯` : `${item.year} World Cup`,
      copy: currentLocale === "zh" ? `${item.goals} 球 · ${item.matches} 场` : `${item.goals} goals · ${item.matches} matches`,
    })
  );

  archiveMilestoneGoalsNode.innerHTML = `
    <h3>${currentLocale === "zh" ? "最早与最晚进球" : "Earliest and latest goals"}</h3>
    ${renderStoryRows(archiveMilestoneGoals.earliest, (item) => ({
      lead: item.label,
      metric: true,
      title: `${item.year} · ${formatPlayerInline(item.player)}`,
      copy: `${item.match}`,
    }))}
    ${renderStoryRows(archiveMilestoneGoals.latest, (item) => ({
      lead: item.label,
      metric: true,
      title: `${item.year} · ${formatPlayerInline(item.player)}`,
      copy: `${item.match}`,
    }))}
  `;

  archiveShootoutsNode.innerHTML = renderStoryRows(
    archiveShootoutMatches,
    (item, index) => ({
      lead: item.score,
      metric: true,
      title: `${item.year} · ${item.match}`,
      copy: currentLocale === "zh" ? `${item.stage} 点球大战` : `${displayStage(item.stage)} penalty shootout`,
    })
  );

  archiveCardsNode.innerHTML = `
    <h3>${currentLocale === "zh" ? "火药味最重的比赛" : "Most card-heavy matches"}</h3>
    ${renderStoryRows(archiveCardHeavyMatches, (item) => ({
      lead: item.cards,
      metric: true,
      title: `${item.year} · ${item.match}`,
      copy:
        currentLocale === "zh"
          ? `${item.stage} · 总牌数 ${item.cards} · 罚下 ${item.reds}`
          : `${displayStage(item.stage)} · ${item.cards} cards total · ${item.reds} reds`,
    }))}
  `;

  archiveStageEvolutionNode.innerHTML = renderStoryRows(
    archiveStageEvolution,
    (item) => ({
      lead: item.stages,
      metric: true,
      title: currentLocale === "zh" ? `${item.year} 赛制结构` : `${item.year} format structure`,
      copy:
        currentLocale === "zh"
          ? `${item.teams} 队 · ${item.groups} 个小组 · ${item.groupStages} 段小组赛 / ${item.knockoutStages} 段淘汰赛`
          : `${item.teams} teams · ${item.groups} groups · ${item.groupStages} group stages / ${item.knockoutStages} knockout stages`,
    })
  );

  archiveGroupsNode.innerHTML = `
    <h3>${currentLocale === "zh" ? "最强小组赛统治力" : "Strongest group-stage dominance"}</h3>
    ${renderStoryRows(archiveGroupDominance, (item) => ({
      lead: item.points,
      metric: true,
      title: `${item.year} · ${displayTeam(item.team)} · ${displayGroupLabel(item.group)}`,
      copy:
        currentLocale === "zh"
          ? `${item.points} 分 · 净胜球 ${item.goalDiff} · 进球 ${item.goalsFor}`
          : `${item.points} points · Goal difference ${item.goalDiff} · Goals ${item.goalsFor}`,
    }))}
  `;

  archiveSubsNode.innerHTML = `
    <h3>${currentLocale === "zh" ? "换人时代" : "Substitution era"}</h3>
    ${renderStoryRows(
      archiveSubstitutionEras.slice(-8).reverse(),
      (item) => ({
        lead: item.perMatch,
        metric: true,
        title: currentLocale === "zh" ? `${item.year} 世界杯` : `${item.year} World Cup`,
        copy: currentLocale === "zh" ? `${item.subs} 次换人事件 · 场均 ${item.perMatch}` : `${item.subs} substitution events · ${item.perMatch} per match`,
      })
    )}
  `;

  eventSummaryNoteNode.textContent =
    currentLocale === "zh"
      ? `结论先看：进球最多的是 ${archiveGoalTournaments[0].year} 年的 ${archiveGoalTournaments[0].goals} 球，换人密度最高的则是 ${archiveSubstitutionEras[archiveSubstitutionEras.length - 1].year} 年，世界杯已经明显进入高轮换时代。`
      : `Start here: ${archiveGoalTournaments[0].year} produced the most goals with ${archiveGoalTournaments[0].goals}, while ${archiveSubstitutionEras[archiveSubstitutionEras.length - 1].year} marks the highest substitution density in the dataset.`;

  chartChampionsNode.innerHTML = renderBarChartSvg(
    archivePodiumMap
      .slice(0, 8)
      .map((item) => ({ label: item.team, value: item.titles })),
    currentLocale === "zh" ? "世界杯冠军分布" : "World Cup title distribution",
    currentLocale === "zh" ? "冠" : "titles"
  );

  chartFormatNode.innerHTML = renderLineChartSvg(
    archiveStageEvolution.map((item) => ({ date: String(item.year), elo: item.teams })),
    currentLocale === "zh" ? "世界杯参赛队规模演化" : "World Cup field size",
    "history-format-gradient"
  );

  chartConfederationsNode.innerHTML = renderBarChartSvg(
    archiveConfederationReach.map((item) => ({
      label: item.confederation,
      value: item.appearances,
    })),
    currentLocale === "zh" ? "世界杯洲际参赛量" : "Confederation appearances",
    currentLocale === "zh" ? "次" : "apps"
  );

  chartGoalsNode.innerHTML = renderLineChartSvg(
    historyTimeline.map((item) => ({ date: String(item.year), elo: item.goals })),
    currentLocale === "zh" ? "世界杯总进球走势" : "Total goals trend",
    "history-goals-gradient"
  );

  chartSubsNode.innerHTML = renderLineChartSvg(
    archiveSubstitutionEras.map((item) => ({ date: String(item.year), elo: item.perMatch })),
    currentLocale === "zh" ? "世界杯换人时代走势" : "Substitution trend",
    "history-subs-gradient"
  );

  chartHostsNode.innerHTML = renderBarChartSvg(
    archiveHostSummary.map((item) => ({ label: item.label, value: item.value })).slice(0, 8),
    currentLocale === "zh" ? "东道主成绩分布" : "Host performance distribution",
    ""
  );

  championSummaryNoteNode.textContent =
    currentLocale === "zh"
      ? `结论先看：按击败对手平均 ELO 计算，${championStrength[0].year} ${championStrength[0].champion} 是这份模型里“通关含金量”最高的冠军。`
      : `Start here: by average Elo of the opponents beaten, ${championStrength[0].year} ${displayTeam(championStrength[0].champion)} is the strongest title run in this model.`;
  neverSummaryNoteNode.textContent =
    currentLocale === "zh"
      ? `结论先看：${bestNeverChampions[0].team} 依然是这份历史样本里最强的无冕者，峰值 ELO 达到 ${bestNeverChampions[0].peakElo}。`
      : `Start here: ${displayTeam(bestNeverChampions[0].team)} remains the strongest non-champion in the sample, peaking at Elo ${bestNeverChampions[0].peakElo}.`;
  collapseSummaryNoteNode.textContent =
    currentLocale === "zh"
      ? `结论先看：${collapseRankings[0].year} ${collapseRankings[0].team} 的翻车最具代表性，说明顶级强队也会在短赛会制里迅速失速。`
      : `Start here: ${collapseRankings[0].year} ${displayTeam(collapseRankings[0].team)} is still the clearest collapse case, showing how quickly elite teams can derail in a short tournament.`;

  championStrengthNode.innerHTML = championStrength
    .map(
      (item, index) => `
        <article class="story-row">
          <span class="story-row__index">${index + 1}</span>
          <div class="story-row__body">
            <strong>${item.year} ${displayTeam(item.champion)}</strong>
            <p>${currentLocale === "zh" ? "击败对手平均 ELO" : "Average Elo of defeated opponents"} ${item.avgDefeatedElo} · ${currentLocale === "zh" ? "全部对手平均 ELO" : "Average Elo of all opponents"} ${item.avgOppElo}</p>
          </div>
        </article>
      `
    )
    .join("");

  neverChampionsNode.innerHTML = bestNeverChampions
    .map(
      (item, index) => `
        <article class="story-row">
          <span class="story-row__index">${index + 1}</span>
          <div class="story-row__body">
            <strong>${displayTeam(item.team)}</strong>
            <p>${currentLocale === "zh" ? "峰值 ELO" : "Peak Elo"} ${item.peakElo} · ${currentLocale === "zh" ? "平均 ELO" : "Average Elo"} ${item.avgElo} · ${currentLocale === "zh" ? `${item.matches} 场比赛` : `${item.matches} matches`}</p>
          </div>
        </article>
      `
    )
    .join("");

  collapseNode.innerHTML = collapseRankings
    .map(
      (item, index) => `
        <article class="story-row">
          <span class="story-row__index">${index + 1}</span>
          <div class="story-row__body">
            <strong>${item.year} ${displayTeam(item.team)}</strong>
            <p>${displayCollapseRecord(item.record)} · ${currentLocale === "zh" ? "峰值前 ELO" : "Elo before peak"} ${item.peakBefore} · ${currentLocale === "zh" ? `爆冷失利 ${item.upsetLosses} 次` : `${item.upsetLosses} upset losses`} · ${currentLocale === "zh" ? "ELO 跌幅" : "Elo drop"} ${item.eloDrop}</p>
            <p>${displayCollapseNote(item)}</p>
          </div>
        </article>
      `
    )
    .join("");

  const teams = Object.keys(teamProfiles);
  teamSelect.innerHTML = teams
    .map((team) => `<option value="${team}">${team}</option>`)
    .join("");
  teamSelect.value = "Brazil";

  const updateProfile = () => {
    const profile = teamProfiles[teamSelect.value];
    if (!profile) {
      return;
    }

    teamProfileNode.innerHTML = `
      <div class="team-profile">
        <div class="team-profile__stats">
          <article class="history-stat">
            <span class="history-stat__label">${currentLocale === "zh" ? "战绩" : "Record"}</span>
            <strong>${profile.wins}-${profile.draws}-${profile.losses}</strong>
            <p>${currentLocale === "zh" ? `${profile.matches} 场 · ${profile.gf} 进球 · ${profile.ga} 失球` : `${profile.matches} matches · ${profile.gf} goals for · ${profile.ga} goals against`}</p>
          </article>
          <article class="history-stat">
            <span class="history-stat__label">${currentLocale === "zh" ? "峰值 ELO" : "Peak Elo"}</span>
            <strong>${profile.peakElo}</strong>
            <p>${profile.peakDate}</p>
          </article>
          <article class="history-stat">
            <span class="history-stat__label">${currentLocale === "zh" ? "最近 ELO" : "Latest Elo"}</span>
            <strong>${profile.latestElo}</strong>
            <p>${currentLocale === "zh" ? `${profile.latestYear} 年样本` : `${profile.latestYear} sample year`}</p>
          </article>
        </div>
        <div class="team-profile__notes">
          <article class="sidebar-card">
            <p class="story-card__tag">${currentLocale === "zh" ? "代表性逆袭" : "Signature upset win"}</p>
            <h3>${displayProfileMatchNote(profile.biggestUpsetWin)}</h3>
          </article>
          <article class="sidebar-card">
            <p class="story-card__tag">${currentLocale === "zh" ? "最痛爆冷失利" : "Most painful upset loss"}</p>
            <h3>${displayProfileMatchNote(profile.worstUpsetLoss)}</h3>
          </article>
        </div>
        <div class="milestone-track">
          ${profile.milestones
            .map(
              (point) => `
                <article class="milestone-point">
                  <span>${point.year}</span>
                  <strong>${point.elo}</strong>
                </article>
              `
            )
            .join("")}
        </div>
      </div>
    `;
  };

  teamSelect.addEventListener("change", updateProfile);
  updateProfile();

  setupCollapsibleSection(archiveHostsNode, { collapsedHeight: 420, itemLabel: currentLocale === "zh" ? "主办国列表" : "host list" });
  setupCollapsibleSection(archiveFormatNode, { collapsedHeight: 420, itemLabel: currentLocale === "zh" ? "赛制演化" : "format evolution" });
  setupCollapsibleSection(archiveDynastiesNode, { collapsedHeight: 420, itemLabel: currentLocale === "zh" ? "王朝球队" : "dynasty teams" });
  setupCollapsibleSection(archiveConfederationsNode, { collapsedHeight: 360, itemLabel: currentLocale === "zh" ? "洲际版图" : "confederation map" });
  setupCollapsibleSection(upsetsNode, { collapsedHeight: 420, itemLabel: currentLocale === "zh" ? "冷门榜" : "upset list" });
  setupCollapsibleSection(shocksNode, { collapsedHeight: 420, itemLabel: currentLocale === "zh" ? "震荡榜" : "shock list" });
  setupCollapsibleSection(archiveScorersNode, { collapsedHeight: 420, itemLabel: currentLocale === "zh" ? "射手榜" : "scorer list" });
  setupCollapsibleSection(archiveAppearancesNode, { collapsedHeight: 360, itemLabel: currentLocale === "zh" ? "出场王" : "appearance leaders" });
  setupCollapsibleSection(archiveEvergreensNode, { collapsedHeight: 360, itemLabel: currentLocale === "zh" ? "常青树" : "evergreens" });
  setupCollapsibleSection(archiveAwardLeadersNode, { collapsedHeight: 360, itemLabel: currentLocale === "zh" ? "奖项领跑者" : "award leaders" });
  setupCollapsibleSection(archiveAwardsNode, { collapsedHeight: 320, itemLabel: currentLocale === "zh" ? "奖项谱系" : "award lineage" });
  setupCollapsibleSection(archiveManagersNode, { collapsedHeight: 360, itemLabel: currentLocale === "zh" ? "主帅榜" : "manager list" });
  setupCollapsibleSection(archiveRefereesNode, { collapsedHeight: 360, itemLabel: currentLocale === "zh" ? "裁判榜" : "referee list" });
  setupCollapsibleSection(archiveGoalTournamentsNode, { collapsedHeight: 360, itemLabel: currentLocale === "zh" ? "高进球届次" : "goal-heavy tournaments" });
  setupCollapsibleSection(archiveMilestoneGoalsNode, { collapsedHeight: 360, itemLabel: currentLocale === "zh" ? "里程碑进球" : "milestone goals" });
  setupCollapsibleSection(archiveShootoutsNode, { collapsedHeight: 360, itemLabel: currentLocale === "zh" ? "点球大战" : "shootouts" });
  setupCollapsibleSection(archiveCardsNode, { collapsedHeight: 360, itemLabel: currentLocale === "zh" ? "纪律名场面" : "discipline matches" });
  setupCollapsibleSection(archiveStageEvolutionNode, { collapsedHeight: 360, itemLabel: currentLocale === "zh" ? "阶段演化" : "stage evolution" });
  setupCollapsibleSection(archiveGroupsNode, { collapsedHeight: 320, itemLabel: currentLocale === "zh" ? "小组统治力" : "group dominance" });
  setupCollapsibleSection(archiveSubsNode, { collapsedHeight: 320, itemLabel: currentLocale === "zh" ? "换人时代" : "substitution era" });
  setupCollapsibleSection(championStrengthNode, { collapsedHeight: 360, itemLabel: currentLocale === "zh" ? "冠军含金量" : "champion strength" });
  setupCollapsibleSection(neverChampionsNode, { collapsedHeight: 360, itemLabel: currentLocale === "zh" ? "无冕之王" : "non-champions" });
  setupCollapsibleSection(collapseNode, { collapsedHeight: 360, itemLabel: currentLocale === "zh" ? "翻车榜" : "collapse list" });
  setupCollapsibleSection(timelineNode, { collapsedHeight: 520, itemLabel: currentLocale === "zh" ? "冠军时间线" : "champion timeline" });

  const syncBackToTop = () => {
    backToTopButton.classList.toggle("is-visible", window.scrollY > 720);
  };

  backToTopButton.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  window.addEventListener("scroll", syncBackToTop, { passive: true });
  syncBackToTop();
  setupSectionObserver();

  initHistoryExplorer();
  initHistoryCurves();
}

function initTeamsHubPage() {
  const gridNode = document.querySelector("#teams-hub-grid");
  const selectNode = document.querySelector("#teams-hub-select");
  const profileNode = document.querySelector("#teams-hub-profile");
  const factsNode = document.querySelector("#teams-hub-facts");
  const linksNode = document.querySelector("#teams-hub-links");
  const curveSelectNode = document.querySelector("#teams-hub-curve-select");
  const curveMetaNode = document.querySelector("#teams-hub-curve-meta");
  const curveNode = document.querySelector("#teams-hub-curve");

  if (
    !gridNode ||
    !selectNode ||
    !profileNode ||
    !factsNode ||
    !linksNode ||
    !curveSelectNode ||
    !curveMetaNode ||
    !curveNode
  ) {
    return;
  }

  const featuredTeams = ["Argentina", "Brazil", "France", "Germany", "England", "Spain"];
  const teamsCopy = currentLocale === "zh"
    ? {
        matches: "场世界杯比赛",
        peak: "峰值 ELO",
        wins: "胜",
        deepPage: "查看球队详情",
        peakLabel: "峰值 ELO",
        record: "总战绩",
        upsetWin: "代表性逆袭",
        allMatches: "全部世界杯比赛",
        allMatchesCopy: "进入单队比赛档案页",
        deepView: "查看详情",
        curve: "ELO 曲线",
        curveCopy: "查看完整历史比赛浏览器",
        trend: "查看比赛史",
        feature: "历史专题",
        featureCopy: "结合历史页与比赛浏览器继续深入",
        matchHistory: "查看比赛史",
        players: "代表人物",
        playersCopy: "从人物专题继续看这支球队最有代表性的球员",
        playerEntry: "打开人物页",
        noCurve: "暂无曲线数据",
        curveStats: "最低",
        curveHigh: "最高",
        curveSample: "样本",
      }
    : {
        matches: "World Cup matches",
        peak: "Peak Elo",
        wins: "wins",
        deepPage: "Open team page",
        peakLabel: "Peak Elo",
        record: "Record",
        upsetWin: "Signature upset",
        allMatches: "Full World Cup match log",
        allMatchesCopy: "Open the single-team archive page",
        deepView: "Open team page",
        curve: "Elo curve",
        curveCopy: "Open the full historical match browser",
        trend: "Open match archive",
        feature: "History feature",
        featureCopy: "Keep going through history pages and the match browser",
        matchHistory: "Open match archive",
        players: "Representative players",
        playersCopy: "Continue through the players feature to see the best-known figures from this team",
        playerEntry: "Open players feature",
        noCurve: "No curve data available yet",
        curveStats: "Low",
        curveHigh: "High",
        curveSample: "sample",
      };

  gridNode.innerHTML = featuredTeams
    .map((team) => {
      const profile = teamProfiles[team];
      if (!profile) {
        return "";
      }
      return `
        <article class="feature-card history-mini-card team-card">
          <p class="story-card__tag">${displayTeamWithFlag(team)}</p>
          <h3>${displayTeamWithFlag(team)}</h3>
          <p>${profile.matches} ${teamsCopy.matches} · ${teamsCopy.peak} ${profile.peakElo} · ${profile.wins} ${teamsCopy.wins}</p>
          <a href="${teamHistoryPath(team)}">${teamsCopy.deepPage}</a>
        </article>
      `;
    })
    .join("");

  mountTeamProfileSelect(selectNode, profileNode, "Argentina");

  const updateSideData = (team) => {
    const profile = teamProfiles[team];
    if (!profile) {
      return;
    }
    const featuredPlayers = [...new Set([
      ...archiveTopScorers.filter((item) => item.team === team).map((item) => item.player),
      ...archiveTopAppearances.filter((item) => item.team === team).map((item) => item.player),
    ])].slice(0, 3);
    factsNode.innerHTML = `
      <article class="summary-pill">
        <strong>${teamsCopy.peakLabel}</strong>
        <span>${profile.peakElo} · ${profile.peakDate}</span>
      </article>
      <article class="summary-pill">
        <strong>${teamsCopy.record}</strong>
        <span>${profile.wins}-${profile.draws}-${profile.losses}</span>
      </article>
      <article class="summary-pill">
        <strong>${teamsCopy.upsetWin}</strong>
        <span>${displayProfileMatchNote(profile.biggestUpsetWin)}</span>
      </article>
      <article class="summary-pill">
        <strong>${teamsCopy.players}</strong>
        <span>${featuredPlayers.length ? featuredPlayers.map((player) => formatPlayerInline(player)).join(" · ") : (currentLocale === "zh" ? "后续补充代表人物" : "Representative players coming next")}</span>
      </article>
    `;

    linksNode.innerHTML = `
      <div class="quick-link-grid">
        <article class="quick-link-card">
          <strong>${displayTeam(team)} ${teamsCopy.allMatches}</strong>
          <p>${teamsCopy.allMatchesCopy}</p>
          <a class="button button--ghost" href="${teamHistoryPath(team)}">${teamsCopy.deepView}</a>
        </article>
        <article class="quick-link-card">
          <strong>${displayTeam(team)} ${teamsCopy.curve}</strong>
          <p>${teamsCopy.curveCopy}</p>
          <a class="button button--ghost" href="${historyMatchesPath()}">${teamsCopy.trend}</a>
        </article>
        <article class="quick-link-card">
          <strong>${displayTeam(team)} ${teamsCopy.feature}</strong>
          <p>${teamsCopy.featureCopy}</p>
          <a class="button button--ghost" href="${historyMatchesPath()}">${teamsCopy.matchHistory}</a>
        </article>
        <article class="quick-link-card">
          <strong>${displayTeam(team)} ${teamsCopy.players}</strong>
          <p>${teamsCopy.playersCopy}</p>
          <a class="button button--ghost" href="${historyPlayersPath()}">${teamsCopy.playerEntry}</a>
        </article>
      </div>
    `;
  };

  selectNode.addEventListener("change", () => updateSideData(selectNode.value));
  updateSideData(selectNode.value);

  curveSelectNode.innerHTML = featuredTeams
    .map((team) => `<option value="${team}">${team}</option>`)
    .join("");
  curveSelectNode.value = "Argentina";

  const updateCurve = () => {
    const points = historyCurves[curveSelectNode.value] || [];
    if (!points.length) {
      curveNode.innerHTML = "";
      curveMetaNode.innerHTML = `<strong>${curveSelectNode.value}</strong><span>${teamsCopy.noCurve}</span>`;
      return;
    }
    curveNode.innerHTML = renderLineChartSvg(points, `${curveSelectNode.value} curve`, "teams-hub-curve-gradient");
    curveMetaNode.innerHTML = `
      <strong>${curveSelectNode.value}</strong>
      <span>${teamsCopy.curveStats} ${Math.min(...points.map((point) => point.elo))} · ${teamsCopy.curveHigh} ${Math.max(...points.map((point) => point.elo))} · ${teamsCopy.curveSample} ${points.length}</span>
    `;
  };

  curveSelectNode.addEventListener("change", updateCurve);
  updateCurve();
}

function initHistoryExplorer() {
  const yearSelect = document.querySelector("#explorer-year");
  const teamSelect = document.querySelector("#explorer-team");
  const upsetSelect = document.querySelector("#explorer-upset");
  const sortSelect = document.querySelector("#explorer-sort");
  const metaNode = document.querySelector("#explorer-meta");
  const listNode = document.querySelector("#history-explorer");

  if (
    !yearSelect ||
    !teamSelect ||
    !upsetSelect ||
    !sortSelect ||
    !metaNode ||
    !listNode
  ) {
    return;
  }

  yearSelect.innerHTML = [
    `<option value="all">${currentLocale === "zh" ? "全部届次" : "All tournaments"}</option>`,
    ...historyExplorerYears.map((year) => `<option value="${year}">${year}</option>`),
  ].join("");
  teamSelect.innerHTML = [
    `<option value="all">${currentLocale === "zh" ? "全部球队" : "All teams"}</option>`,
    ...historyExplorerTeams.map((team) => `<option value="${team}">${team}</option>`),
  ].join("");
  upsetSelect.innerHTML = `
    <option value="all">${currentLocale === "zh" ? "全部比赛" : "All matches"}</option>
    <option value="upset">${currentLocale === "zh" ? "只看爆冷" : "Upsets only"}</option>
    <option value="non-upset">${currentLocale === "zh" ? "排除爆冷" : "Exclude upsets"}</option>
  `;
  sortSelect.innerHTML = `
    <option value="date-desc">${currentLocale === "zh" ? "按时间倒序" : "Newest first"}</option>
    <option value="elo-gap">${currentLocale === "zh" ? "按 ELO 差排序" : "Sort by Elo gap"}</option>
    <option value="swing">${currentLocale === "zh" ? "按波动排序" : "Sort by swing"}</option>
    <option value="goals">${currentLocale === "zh" ? "按总进球排序" : "Sort by total goals"}</option>
  `;

  const update = () => {
    let matches = [...historyAllMatches];

    if (yearSelect.value !== "all") {
      matches = matches.filter((match) => String(match.year) === yearSelect.value);
    }
    if (teamSelect.value !== "all") {
      matches = matches.filter(
        (match) => match.home === teamSelect.value || match.away === teamSelect.value
      );
    }
    if (upsetSelect.value === "upset") {
      matches = matches.filter((match) => match.upset);
    }
    if (upsetSelect.value === "non-upset") {
      matches = matches.filter((match) => !match.upset);
    }

    matches.sort((a, b) => compareExplorerMatches(a, b, sortSelect.value));

    metaNode.textContent = currentLocale === "zh"
      ? `当前结果：${matches.length} 场比赛`
      : `Current results: ${matches.length} matches`;

    listNode.innerHTML = matches
      .slice(0, 48)
      .map(
        (match) => `
          <article class="explorer-row">
            <div class="explorer-row__top">
              <strong>${displayTeam(match.home)} ${match.homeGoals}:${match.awayGoals} ${displayTeam(match.away)}</strong>
              <span>${match.date}</span>
            </div>
            <div class="explorer-row__meta">
              <span>${match.upset ? (currentLocale === "zh" ? "爆冷" : "Upset") : (currentLocale === "zh" ? "常规结果" : "Standard result")}</span>
              <span>${currentLocale === "zh" ? "ELO 差" : "Elo gap"} ${match.eloGap}</span>
              <span>${currentLocale === "zh" ? "波动" : "Swing"} ${match.swing}</span>
              <span>${currentLocale === "zh" ? "赛前" : "Pre-match"} ${match.homeEloBefore} vs ${match.awayEloBefore}</span>
            </div>
          </article>
        `
      )
      .join("");

    setupCollapsibleSection(listNode, {
      collapsedHeight: 540,
      buttonText: currentLocale === "zh" ? "展开更多比赛" : "Show more matches",
      buttonTextExpanded: currentLocale === "zh" ? "收起比赛列表" : "Hide match list",
      itemLabel: currentLocale === "zh" ? "历史比赛浏览器" : "historical match browser",
    });
  };

  yearSelect.addEventListener("change", update);
  teamSelect.addEventListener("change", update);
  upsetSelect.addEventListener("change", update);
  sortSelect.addEventListener("change", update);
  update();
}

function initHistoryCurves() {
  const teamSelect = document.querySelector("#curve-team-select");
  const chartNode = document.querySelector("#curve-chart");
  const metaNode = document.querySelector("#curve-meta");

  if (!teamSelect || !chartNode || !metaNode) {
    return;
  }

  teamSelect.innerHTML = historyCurveTeams
    .map((team) => `<option value="${team}">${team}</option>`)
    .join("");
  teamSelect.value = "Brazil";

  const update = () => {
    const points = historyCurves[teamSelect.value] || [];
    if (!points.length) {
      chartNode.innerHTML = "";
      metaNode.textContent =
        currentLocale === "zh" ? "没有可展示的 ELO 曲线数据。" : "No Elo curve data available to display.";
      return;
    }
    chartNode.innerHTML = renderLineChartSvg(
      points,
      `${displayTeam(teamSelect.value)} ELO curve`,
      "curve-gradient"
    );

    metaNode.innerHTML = `
      <strong>${displayTeam(teamSelect.value)}</strong>
      <span>${currentLocale === "zh" ? "最低" : "Low"} ${Math.min(...points.map((point) => point.elo))} · ${currentLocale === "zh" ? "最高" : "High"} ${Math.max(...points.map((point) => point.elo))} · ${currentLocale === "zh" ? "样本" : "Sample"} ${points.length}${currentLocale === "zh" ? " 场" : ""}</span>
    `;
  };

  teamSelect.addEventListener("change", update);
  update();
}

function initTeamHistoryPage() {
  const teamSelect = document.querySelector("#team-history-select");
  const sortSelect = document.querySelector("#team-history-sort");
  const summaryNode = document.querySelector("#team-history-summary");
  const matchesNode = document.querySelector("#team-history-matches");
  const curveNode = document.querySelector("#team-history-curve");
  const curveMetaNode = document.querySelector("#team-history-curve-meta");
  const linksNode = document.querySelector("#team-history-links");

  if (
    !teamSelect ||
    !sortSelect ||
    !summaryNode ||
    !matchesNode ||
    !curveNode ||
    !curveMetaNode ||
    !linksNode
  ) {
    return;
  }

  const queryTeam = new URLSearchParams(window.location.search).get("team");
  teamSelect.innerHTML = historyExplorerTeams
    .map((team) => `<option value="${team}">${team}</option>`)
    .join("");
  teamSelect.value =
    queryTeam && historyExplorerTeams.includes(queryTeam) ? queryTeam : "Brazil";
  const teamCopy = currentLocale === "zh"
    ? {
        totalRecord: "总战绩",
        totalMatches: "场世界杯比赛",
        goals: "进失球",
        goalDiff: "净胜球",
        upsets: "爆冷表现",
        upsetPair: "爆冷赢球 / 被爆冷输球",
        upset: "爆冷",
        normal: "常规结果",
        eloGap: "ELO 差",
        swing: "波动",
        noCurve: "这支球队没有现成的 ELO 轨迹图。",
        noCurveSample: "暂无曲线样本",
        players: "代表人物",
        playersCopy: "去看人物与奖项专题",
        low: "最低",
        high: "最高",
        sample: "样本",
        teamsHome: "球队首页",
        backTeams: "回到球队入口页",
        historyMatches: "历史匹配",
        fullBrowser: "查看完整历史比赛浏览器",
        trends: "比赛史",
        trendsCopy: "查看完整历史比赛浏览器",
        switchTeam: "换另一队",
        switchTeamCopy: "快速切到巴西",
      }
    : {
        totalRecord: "Record",
        totalMatches: "World Cup matches",
        goals: "Goals for / against",
        goalDiff: "Goal difference",
        upsets: "Upset profile",
        upsetPair: "upset wins / upset losses",
        upset: "Upset",
        normal: "Standard result",
        eloGap: "Elo gap",
        swing: "Swing",
        noCurve: "This team does not have an Elo curve ready yet.",
        noCurveSample: "No curve sample yet",
        players: "Representative players",
        playersCopy: "Open the players and awards feature",
        low: "Low",
        high: "High",
        sample: "sample",
        teamsHome: "Teams hub",
        backTeams: "Back to teams home",
        historyMatches: "History browser",
        fullBrowser: "Open the full historical match browser",
        trends: "Match browser",
        trendsCopy: "Open the full historical match browser",
        switchTeam: "Switch team",
        switchTeamCopy: "Jump quickly to Brazil",
      };

  const update = () => {
    const team = teamSelect.value;
    const matches = historyAllMatches
      .filter((match) => match.home === team || match.away === team)
      .sort((a, b) => compareExplorerMatches(a, b, sortSelect.value));

    const wins = matches.filter(
      (match) =>
        (match.home === team && match.homeGoals > match.awayGoals) ||
        (match.away === team && match.awayGoals > match.homeGoals)
    ).length;
    const draws = matches.filter((match) => match.homeGoals === match.awayGoals).length;
    const losses = matches.length - wins - draws;
    const gf = matches.reduce(
      (sum, match) =>
        sum + (match.home === team ? match.homeGoals : match.awayGoals),
      0
    );
    const ga = matches.reduce(
      (sum, match) =>
        sum + (match.home === team ? match.awayGoals : match.homeGoals),
      0
    );
    const upsets = matches.filter(
      (match) => match.upset && match.winner === team
    ).length;
    const upsetLosses = matches.filter(
      (match) =>
        match.upset &&
        match.result !== "draw" &&
        match.winner !== team &&
        (match.home === team || match.away === team)
    ).length;

    const profile = teamProfiles[team];
    const featuredPlayers = [...new Set([
      ...archiveTopScorers.filter((item) => item.team === team).map((item) => item.player),
      ...archiveTopAppearances.filter((item) => item.team === team).map((item) => item.player),
    ])].slice(0, 4);
    summaryNode.innerHTML = `
      ${profile ? renderTeamProfileMarkup(profile) : ""}
      <div class="team-compact-summary">
        <div class="team-compact-summary__grid">
          <article class="archive-chip">
            <strong>${wins}-${draws}-${losses}</strong>
            <span>${teamCopy.totalRecord} · ${matches.length} ${teamCopy.totalMatches}</span>
          </article>
          <article class="archive-chip">
            <strong>${gf}:${ga}</strong>
            <span>${teamCopy.goals} · ${teamCopy.goalDiff} ${gf - ga}</span>
          </article>
          <article class="archive-chip">
            <strong>${upsets}/${upsetLosses}</strong>
            <span>${teamCopy.upsets} · ${teamCopy.upsetPair}</span>
          </article>
          <article class="archive-chip">
            <strong>${profile ? profile.peakElo : "--"}</strong>
            <span>${currentLocale === "zh" ? "峰值 ELO" : "Peak Elo"} · ${profile ? profile.latestElo : "--"} ${currentLocale === "zh" ? "最近值" : "latest"}</span>
          </article>
        </div>
        <div class="team-compact-summary__note">
          <strong>${teamCopy.players}</strong>
          <span>${featuredPlayers.length ? featuredPlayers.map((player) => formatPlayerInline(player)).join(" · ") : teamCopy.playersCopy}</span>
        </div>
      </div>
    `;

    matchesNode.innerHTML = matches
      .map(
        (match) => `
          <article class="explorer-row">
            <div class="explorer-row__top">
              <strong class="fixture-line">${renderTeamLink(match.home)} <span>${match.homeGoals}:${match.awayGoals}</span> ${renderTeamLink(match.away)}</strong>
              <span>${match.date}</span>
            </div>
            <div class="explorer-row__meta">
              <span>${match.upset ? teamCopy.upset : teamCopy.normal}</span>
              <span>${teamCopy.eloGap} ${match.eloGap}</span>
              <span>${teamCopy.swing} ${match.swing}</span>
            </div>
          </article>
        `
      )
      .join("");

    const curvePoints = historyCurves[team] || [];
    if (curvePoints.length) {
      curveNode.innerHTML = renderLineChartSvg(
        curvePoints,
        `${displayTeam(team)} history curve`,
        "curve-gradient-alt"
      );
      curveMetaNode.innerHTML = `
        <strong>${displayTeam(team)}</strong>
        <span>${teamCopy.low} ${Math.min(...curvePoints.map((point) => point.elo))} · ${teamCopy.high} ${Math.max(...curvePoints.map((point) => point.elo))} · ${teamCopy.sample} ${curvePoints.length}</span>
      `;
    } else {
      curveNode.innerHTML = `<div class="matchup-placeholder">${teamCopy.noCurve}</div>`;
      curveMetaNode.innerHTML = `<strong>${displayTeam(team)}</strong><span>${teamCopy.noCurveSample}</span>`;
    }

    linksNode.innerHTML = `
      <li><strong>${teamCopy.teamsHome}:</strong> <a href="${teamsPath()}">${teamCopy.backTeams}</a></li>
      <li><strong>${teamCopy.historyMatches}:</strong> <a href="${historyMatchesPath()}">${teamCopy.fullBrowser}</a></li>
      <li><strong>${teamCopy.players}:</strong> <a href="${historyPlayersPath()}">${teamCopy.playersCopy}</a></li>
      <li><strong>${teamCopy.trends}:</strong> <a href="${historyMatchesPath()}">${teamCopy.trendsCopy}</a></li>
      <li><strong>${teamCopy.switchTeam}:</strong> <a href="${teamHistoryPath("Brazil")}">${teamCopy.switchTeamCopy}</a></li>
    `;

    const nextUrl = new URL(window.location.href);
    nextUrl.searchParams.set("team", team);
    window.history.replaceState({}, "", nextUrl);
  };

  teamSelect.addEventListener("change", update);
  sortSelect.addEventListener("change", update);
  update();
}

function initPredictionPage() {
  const assumptionsNode = document.querySelector("#model-assumptions");
  const oddsNode = document.querySelector("#title-odds");
  const teamASelect = document.querySelector("#team-a");
  const teamBSelect = document.querySelector("#team-b");
  const resultNode = document.querySelector("#matchup-result");

  if (
    !assumptionsNode ||
    !oddsNode ||
    !teamASelect ||
    !teamBSelect ||
    !resultNode
  ) {
    return;
  }

  const predictionCopy = currentLocale === "zh"
    ? {
        oddsLabel: "简化争冠概率",
        chooseDifferent: "请选择两支不同的球队。",
        eloGap: "ELO 差值",
        win: "胜",
        draw: "平局",
        knockout: "淘汰赛晋级概率",
      }
    : {
        oddsLabel: "Simplified title probability",
        chooseDifferent: "Please select two different teams.",
        eloGap: "Elo gap",
        win: "win",
        draw: "draw",
        knockout: "Knockout advance probability",
      };

  const localizedAssumptions = currentLocale === "zh"
    ? modelAssumptions
    : [
        "This model uses the latest World Cup Elo value from the historical spreadsheet as the base team strength.",
        "It assumes a neutral venue and does not add home-field advantage.",
        "Three-way probabilities include the draw; knockout advance probability treats penalties as a 50-50 split after a draw.",
        "Title probability is based on a simplified knockout simulation among the highest-Elo teams and is meant to explain the model, not replace market odds.",
      ];

  assumptionsNode.innerHTML = localizedAssumptions
    .map((item) => `<li>${item}</li>`)
    .join("");

  oddsNode.innerHTML = titleOdds
    .map(
      (item, index) => `
        <article class="odds-row odds-row--rank-${Math.min(index + 1, 3)}">
          <div>
            <strong>${displayTeamWithFlag(item.team)}</strong>
            <span>${predictionCopy.oddsLabel}</span>
          </div>
          <div class="odds-row__bar">
            <span style="width: ${item.probability}%"></span>
          </div>
          <em>${item.probability.toFixed(2)}%</em>
        </article>
      `
    )
    .join("");

  const options = predictionTeams
    .map(
      (item) =>
        `<option value="${item.team}">${displayTeamWithFlag(item.team)} · ELO ${item.elo}</option>`
    )
    .join("");

  teamASelect.innerHTML = options;
  teamBSelect.innerHTML = options;
  teamASelect.value = "Argentina";
  teamBSelect.value = "France";

  const update = () => {
    const teamA = predictionTeams.find((item) => item.team === teamASelect.value);
    const teamB = predictionTeams.find((item) => item.team === teamBSelect.value);

    if (!teamA || !teamB || teamA.team === teamB.team) {
      resultNode.innerHTML = `
        <div class="matchup-placeholder">
          ${predictionCopy.chooseDifferent}
        </div>
      `;
      return;
    }

    const { homeWin, draw, awayWin, knockoutA } = calculateMatchup(
      teamA.elo,
      teamB.elo
    );

    resultNode.innerHTML = `
      <div class="matchup-card">
        <div class="matchup-card__header">
          <h3>${displayTeamWithFlag(teamA.team)} vs ${displayTeamWithFlag(teamB.team)}</h3>
          <p>${predictionCopy.eloGap}: ${teamA.elo - teamB.elo}</p>
        </div>
        <div class="probability-grid probability-grid--bars">
          <article class="probability-card probability-card--win">
            <span>${displayTeamWithFlag(teamA.team)} ${predictionCopy.win}</span>
            <div class="probability-card__bar"><i style="width: ${homeWin * 100}%"></i></div>
            <strong>${formatPct(homeWin)}</strong>
          </article>
          <article class="probability-card probability-card--draw">
            <span>${predictionCopy.draw}</span>
            <div class="probability-card__bar"><i style="width: ${draw * 100}%"></i></div>
            <strong>${formatPct(draw)}</strong>
          </article>
          <article class="probability-card probability-card--loss">
            <span>${displayTeamWithFlag(teamB.team)} ${predictionCopy.win}</span>
            <div class="probability-card__bar"><i style="width: ${awayWin * 100}%"></i></div>
            <strong>${formatPct(awayWin)}</strong>
          </article>
        </div>
        <div class="knockout-card">
          <span>${predictionCopy.knockout}</span>
          <strong>${displayTeamWithFlag(teamA.team)} ${formatPct(knockoutA)}</strong>
          <strong>${displayTeamWithFlag(teamB.team)} ${formatPct(1 - knockoutA)}</strong>
        </div>
      </div>
    `;
  };

  teamASelect.addEventListener("change", update);
  teamBSelect.addEventListener("change", update);
  update();
}

function renderMatchCard(match) {
  const matchCopy = currentLocale === "zh"
    ? {
        open: "比赛页",
        prediction: "预测",
      }
    : {
        open: "Match",
        prediction: "Prediction",
      };

  return `
    <article class="match-card">
      <span class="match-card__stage">${displayStage(match.stage)} · ${humanizeMatchStatus(match)}</span>
      <div class="match-card__fixture">
        <strong class="match-card__line">
          ${renderTeamLink(match.home)}
          <span class="match-card__score">${match.score}</span>
          ${renderTeamLink(match.away)}
        </strong>
      </div>
      <p class="match-card__meta">${displayMatchMeta(match)}</p>
      <div class="match-card__actions">
        <a class="button button--ghost" href="${matchPath(match.id)}">${matchCopy.open}</a>
        <a class="button button--ghost" href="${predictionPath()}">${matchCopy.prediction}</a>
      </div>
    </article>
  `;
}

function renderGroupTabs(groupTabs, groupTableBody) {
  const groupKeys = Object.keys(groups);
  const currentGroup = groupKeys.includes(activeGroup) ? activeGroup : getDefaultGroupKey();
  activeGroup = currentGroup;

  groupTabs.innerHTML = groupKeys
    .map(
      (group) => `
        <button
          class="group-tab"
          type="button"
          role="tab"
          aria-selected="${group === currentGroup}"
          data-group="${group}"
        >
          ${displayGroupLabel(group)}
        </button>
      `
    )
    .join("");

  [...groupTabs.querySelectorAll("[data-group]")].forEach((button) => {
    button.addEventListener("click", () => {
      activeGroup = button.dataset.group;
      renderGroupTabs(groupTabs, groupTableBody);
      renderGroupTable(groupTableBody, activeGroup);
    });
  });
}

function renderGroupTable(groupTableBody, groupKey) {
  const rows = groups[groupKey] || groups[getDefaultGroupKey()] || [];

  groupTableBody.innerHTML = rows
    .map((team, index) => {
      const rowClass = index < 2 ? "standings-row standings-row--qualified" : index === 2 ? "standings-row standings-row--playoff" : "standings-row";
      const zoneLabel = currentLocale === "zh"
        ? (index < 2 ? "直通区" : index === 2 ? "第三名比较" : "追赶区")
        : (index < 2 ? "auto spot" : index === 2 ? "best-third race" : "chasing pack");
      const detailLabel = currentLocale === "zh"
        ? `净胜球 ${team.goal_difference > 0 ? `+${team.goal_difference}` : team.goal_difference} · ${team.goals_for}:${team.goals_against}`
        : `GD ${team.goal_difference > 0 ? `+${team.goal_difference}` : team.goal_difference} · ${team.goals_for}:${team.goals_against}`;
      return `
        <tr class="${rowClass}">
          <td>
            <div class="standings-team">
              <span class="standings-pos">${index + 1}</span>
              <div>
                <strong>${renderTeamLink(team.team)}</strong>
                <span class="standings-zone">${zoneLabel}</span>
                <span class="standings-detail">${detailLabel}</span>
                <div class="standings-form" aria-label="${currentLocale === "zh" ? "小组战绩" : "group record"}">
                  <span class="form-dot form-dot--win">${currentLocale === "zh" ? "胜" : "W"} ${team.win}</span>
                  <span class="form-dot form-dot--draw">${currentLocale === "zh" ? "平" : "D"} ${team.draw}</span>
                  <span class="form-dot form-dot--loss">${currentLocale === "zh" ? "负" : "L"} ${team.loss}</span>
                </div>
              </div>
            </div>
          </td>
          <td>${team.played}</td>
          <td>${team.win}</td>
          <td>${team.draw}</td>
          <td>${team.loss}</td>
          <td><strong class="standings-points">${team.points}</strong></td>
        </tr>
      `
    })
    .join("");
}

function renderPoll(pollNode) {
  const totalVotes = pollOptions.reduce((sum, option) => sum + option.votes, 0);

  pollNode.innerHTML = pollOptions
    .map((option) => {
      const isActive = option.label === activeVote;
      const percentage = Math.round((option.votes / totalVotes) * 100);

      return `
        <div class="poll__row">
          <button
            class="poll__button ${isActive ? "is-active" : ""}"
            type="button"
            data-vote="${option.label}"
          >
            ${displayTeam(option.label)}
          </button>
          <span class="poll__result">${percentage}%</span>
        </div>
      `;
    })
    .join("");

  [...pollNode.querySelectorAll("[data-vote]")].forEach((button) => {
    button.addEventListener("click", () => {
      activeVote = button.dataset.vote;
      renderPoll(pollNode);
    });
  });
}

function renderScheduleFilters(filterNode, scheduleList) {
  const stages = ["all", ...new Set(matches.map((match) => match.stage))];

  filterNode.innerHTML = stages
    .map(
      (stage) => `
        <button
          class="filter-button"
          type="button"
          role="tab"
          aria-selected="${stage === activeStage}"
          data-stage="${stage}"
        >
          ${stage === "all" ? (currentLocale === "zh" ? "全部" : "All") : displayStage(stage)}
        </button>
      `
    )
    .join("");

  [...filterNode.querySelectorAll("[data-stage]")].forEach((button) => {
    button.addEventListener("click", () => {
      activeStage = button.dataset.stage;
      renderScheduleFilters(filterNode, scheduleList);
      renderScheduleList(scheduleList, activeStage);
    });
  });
}

function renderScheduleList(scheduleList, stage) {
  const visibleMatches =
    stage === "all"
      ? matches
      : matches.filter((match) => match.stage === stage);

  scheduleList.innerHTML = sortMatchesChronologically(visibleMatches).map(renderScheduleRow).join("");
}

function renderRankingList(items) {
  return items
    .map(
      (item, index) => `
        <article class="ranking-row">
          <span class="ranking-row__index">${index + 1}</span>
          <strong>${displayTeam(item.team)}</strong>
          <span>${item.label}</span>
          <em>${item.value}</em>
        </article>
      `
    )
    .join("");
}

function compareExplorerMatches(a, b, mode) {
  if (mode === "elo-gap") {
    return b.eloGap - a.eloGap || b.date.localeCompare(a.date);
  }
  if (mode === "swing") {
    return b.swing - a.swing || b.date.localeCompare(a.date);
  }
  if (mode === "goals") {
    return b.homeGoals + b.awayGoals - (a.homeGoals + a.awayGoals) || b.date.localeCompare(a.date);
  }
  return b.date.localeCompare(a.date);
}

function renderScheduleRow(match) {
  const scheduleCopy = currentLocale === "zh"
    ? {
        details: "比赛详情",
        prediction: "预测",
        pre: "即将开始",
        live: "正在进行",
        post: "完场回看",
      }
    : {
        details: "Match details",
        prediction: "Prediction",
        pre: "Next up",
        live: "Live now",
        post: "Full-time",
      };
  const phaseLine = match.phase === "in_match"
    ? `${scheduleCopy.live} · ${match.minute || humanizeMatchStatus(match)}`
    : match.phase === "post_match"
      ? `${scheduleCopy.post} · ${match.score}`
      : `${scheduleCopy.pre} · ${match.kickoff}`;
  return `
    <article class="schedule-row">
      <div>
        <strong class="fixture-line">${renderTeamLink(match.home)} <span>×</span> ${renderTeamLink(match.away)}</strong>
        <p>${displayStage(match.stage)} · ${displayVenue(match.venue)} · ${phaseLine}</p>
      </div>
      <div class="schedule-row__actions">
        <a class="button button--ghost" href="${matchPath(match.id)}">${scheduleCopy.details}</a>
        <a class="button button--ghost" href="${predictionPath()}">${scheduleCopy.prediction}</a>
      </div>
    </article>
  `;
}

function renderMatchSpotlight(match) {
  const spotlightCopy = currentLocale === "zh"
    ? {
        open: "查看比赛",
        prediction: "看预测",
        pre: "即将开始",
        live: "实时",
        post: "完场",
      }
    : {
        open: "Open match",
        prediction: "Prediction",
        pre: "Next up",
        live: "Live",
        post: "Full-time",
      };
  const statusTag = match.phase === "in_match"
    ? `${spotlightCopy.live}${match.minute ? ` · ${match.minute}` : ""}`
    : match.phase === "post_match"
      ? `${spotlightCopy.post} · ${match.score}`
      : `${spotlightCopy.pre} · ${match.kickoff}`;
  return `
    <article class="spotlight-match">
      <div>
        <p class="story-card__tag">${statusTag}</p>
        <h3 class="fixture-line">${renderTeamLink(match.home)} <span>×</span> ${renderTeamLink(match.away)}</h3>
        <p>${displayVenue(match.venue)} · ${displayStage(match.stage)}</p>
      </div>
      <div class="spotlight-match__actions">
        <a class="button button--ghost" href="${matchPath(match.id)}">${spotlightCopy.open}</a>
        <a class="button button--ghost" href="${predictionPath()}">${spotlightCopy.prediction}</a>
      </div>
    </article>
  `;
}

function renderMatchStateNotice(title, copy) {
  const label =
    currentLocale === "zh"
      ? (matches.some((match) => match.phase === "in_match") ? currentUi.inMatch : currentUi.preTournament)
      : (matches.some((match) => match.phase === "in_match") ? currentUi.inMatch : currentUi.preTournament);
  const nextMatch = sortMatchesChronologically(
    matches.filter((match) => match.phase === "pre_match")
  )[0];
  const nextMatchMarkup = nextMatch
    ? `
      <div class="notice-next-match">
        <span class="story-card__tag">${currentLocale === "zh" ? "先看这场" : "Start here"}</span>
        <strong class="fixture-line">${renderTeamLink(nextMatch.home)} <span>×</span> ${renderTeamLink(nextMatch.away)}</strong>
        <p>${nextMatch.kickoff} · ${displayVenue(nextMatch.venue)}</p>
        <div class="spotlight-match__actions">
          <a class="button button--ghost" href="${matchPath(nextMatch.id)}">${currentLocale === "zh" ? "查看比赛" : "Open match"}</a>
          <a class="button button--ghost" href="${predictionPath()}">${currentLocale === "zh" ? "看预测" : "Prediction"}</a>
        </div>
      </div>
    `
    : "";
  return `
    <article class="feature-card history-mini-card">
      <p class="story-card__tag">${label}</p>
      <h3>${title}</h3>
      <p>${copy}</p>
      ${nextMatchMarkup}
      <a href="${pagePath("schedule")}">${currentUi.viewFullSchedule}</a>
    </article>
  `;
}

function renderLiveCard(match) {
  const liveCopy = currentLocale === "zh"
    ? {
        open: "打开比赛页",
        prediction: "看预测",
        next: "下一场",
        final: "已结束",
      }
    : {
        open: "Open match",
        prediction: "Prediction",
        next: "Next",
        final: "Final",
      };
  const phaseMeta = match.phase === "in_match"
    ? `${displayStage(match.stage)} · ${match.minute || currentUi.statusLive}`
    : match.phase === "post_match"
      ? `${liveCopy.final} · ${match.score}`
      : `${liveCopy.next} · ${match.kickoff}`;
  return `
    <article class="live-card">
      <div class="live-card__top">
        <span class="live-pill ${match.phase === "in_match" ? "is-live" : ""}">${humanizeMatchStatus(match)}</span>
        <span>${phaseMeta}</span>
      </div>
      <h3 class="fixture-line">${renderTeamLink(match.home)} <span>${match.score}</span> ${renderTeamLink(match.away)}</h3>
      <p>${match.kickoff} · ${displayVenue(match.venue)}</p>
      <div class="live-card__actions">
        <a class="button button--ghost" href="${matchPath(match.id)}">${liveCopy.open}</a>
        <a class="button button--ghost" href="${predictionPath()}">${liveCopy.prediction}</a>
      </div>
    </article>
  `;
}

function renderWatchlistCard(match) {
  const watchlistCopy = currentLocale === "zh"
    ? {
        details: "比赛详情",
        prediction: "预测",
        live: "正在进行",
        final: "完场回看",
      }
    : {
        details: "Match details",
        prediction: "Prediction",
        live: "Live now",
        final: "Full-time",
      };
  const subline = match.phase === "in_match"
    ? `${watchlistCopy.live} · ${match.minute || currentUi.statusLive}`
    : match.phase === "post_match"
      ? `${watchlistCopy.final} · ${match.score}`
      : `${displayStage(match.stage)} · ${match.kickoff}`;
  return `
    <article class="watchlist-row">
      <strong class="fixture-line">${renderTeamLink(match.home)} <span>×</span> ${renderTeamLink(match.away)}</strong>
      <span>${subline}</span>
      <div class="watchlist-row__actions">
        <a class="button button--ghost" href="${matchPath(match.id)}">${watchlistCopy.details}</a>
        <a class="button button--ghost" href="${predictionPath()}">${watchlistCopy.prediction}</a>
      </div>
    </article>
  `;
}

function pagePath(routeKey) {
  return localizedRoutes[routeKey]?.[currentLocale] || homepageCopy[currentLocale]?.switchHref || "/";
}

function matchPath(matchId) {
  return `${pagePath("match")}?id=${matchId}`;
}

function predictionPath() {
  return pagePath("prediction");
}

function articlePath() {
  return currentLocale === "en" ? "../article.html" : "/article.html";
}

function teamsPath() {
  return pagePath("teams");
}

function teamHistoryPath(team) {
  return `${pagePath("teamHistory")}?team=${encodeURIComponent(team)}`;
}

function historyMatchesPath() {
  return pagePath("historyMatches");
}

function historyArchivePath() {
  return pagePath("historyArchive");
}

function historyPlayersPath() {
  return pagePath("historyPlayers");
}

function historyUpsetsPath() {
  return pagePath("historyUpsets");
}

function humanizeMatchStatus(match) {
  if (match.phase === "in_match" || match.status === "live") {
    return match.minute
      ? `${currentUi.statusLive} ${match.minute}`
      : currentUi.statusLive;
  }
  if (match.phase === "post_match" || match.status === "finished") {
    return currentUi.statusFinished;
  }
  if (match.status === "postponed") {
    return currentUi.statusPostponed;
  }
  return currentUi.statusScheduled;
}

function displayTeam(team) {
  if (currentLocale === "zh") {
    return team;
  }
  return teamNameMap[team] || team;
}

function getTeamFlag(team) {
  const normalized = teamNameMap[team] || team;
  return teamFlagMap[normalized] || "";
}

function displayTeamWithFlag(team) {
  const flag = getTeamFlag(team);
  const label = displayTeam(team);
  return flag ? `${flag} ${label}` : label;
}

function renderTeamLink(team) {
  const flag = getTeamFlag(team);
  return `<a class="team-link" href="${teamHistoryPath(team)}">${flag ? `<span class="team-flag">${flag}</span>` : ""}<span>${displayTeam(team)}</span></a>`;
}

function displayScore(score) {
  if (currentLocale === "zh") {
    return score;
  }
  return score.replace("（点球）", " (pens)");
}

function displayMatchMeta(match) {
  if (currentLocale === "zh") {
    return match.meta;
  }
  return match.meta
    .replace("揭幕战", "Opening match")
    .replace("半决赛", "Semi-final")
    .replace("决赛", "Final")
    .replace(/([A-L])组首轮/g, "Group $1 · Matchday 1");
}

function displayArchiveFormat(format) {
  if (currentLocale === "zh") {
    return format;
  }
  return format
    .replaceAll("16强", "Round of 16")
    .replaceAll("8强", "Quarter-finals")
    .replaceAll("半决赛", "Semi-finals")
    .replaceAll("三四名", "Third-place match")
    .replaceAll("决赛轮", "Final round")
    .replaceAll("第二小组赛", "Second group stage");
}

function displayProfileMatchNote(note) {
  if (currentLocale === "zh") {
    return note;
  }
  const parsed = note.match(/^(\d{4})\s+(.+?)\s+([0-9:]+(?:（点球）)?)\s+(.+)$/);
  if (!parsed) {
    return note;
  }
  return `${parsed[1]} ${displayTeam(parsed[2])} ${displayScore(parsed[3])} ${displayTeam(parsed[4])}`;
}

function localizeHistoryOverview(item, index) {
  if (currentLocale === "zh") {
    return item;
  }
  const entries = [
    {
      label: "Tournament coverage",
      detail: "Covers every completed World Cup from 1930 through 2022.",
    },
    {
      label: "Match count",
      detail: "Aggregated from the match-by-match spreadsheet using the `WC` competition code.",
    },
    {
      label: "Total goals",
      detail: "An average of 2.82 goals per match supports long-term trend and style analysis.",
    },
    {
      label: "Upset count",
      detail: "Defined as matches won by the lower pre-match Elo side, making this one of the site’s strongest drama layers.",
    },
  ];
  return entries[index] || item;
}

function localizeArchiveOverview(item, index) {
  if (currentLocale === "zh") {
    return item;
  }
  const entries = [
    {
      label: "Archive scope",
      value: "27 datasets",
      detail: "Pulls tournaments, matches, players, events, and standings into one historical layer.",
    },
    {
      label: "Tournaments covered",
      value: "22",
      detail: "Full coverage of all 22 men’s World Cups from 1930 to 2022.",
    },
    {
      label: "Match count",
      value: "964",
      detail: "Match-level structure supports stage, venue, city, referee, and event views.",
    },
    {
      label: "Event records",
      value: "13,302",
      detail: "Goals, penalties, bookings, and substitutions all feed the same archive layer.",
    },
    {
      label: "Team records",
      value: "85",
      detail: "Includes appearances, rankings, hosts, groups, and match performance.",
    },
    {
      label: "Player records",
      value: "8,482",
      detail: "Built from squads, appearances, goals, and awards.",
    },
    {
      label: "Managers / referees",
      value: "376 / 400",
      detail: "The archive keeps the bench and officiating layer, not just the players.",
    },
    {
      label: "Venues and cities",
      value: "193",
      detail: "Every host stadium and city can feed the geographic archive layer.",
    },
  ];
  return entries[index] || item;
}

function displayTimelineNote(item) {
  if (currentLocale === "zh") {
    return item.note;
  }
  const notes = {
    1930: "The first World Cup ended with the hosts lifting the trophy.",
    1934: "The tournament shifted into a knockout-era format.",
    1938: "Italy completed back-to-back titles.",
    1950: "A classic tournament decided by the final round.",
    1954: "The Miracle of Bern arrived with a goal explosion.",
    1958: "Brazil won the title for the first time.",
    1962: "Brazil successfully defended the trophy.",
    1966: "England claimed their only World Cup title.",
    1970: "Brazil lifted their third crown.",
    1974: "One of the defining tournaments of the Total Football era.",
    1978: "Argentina won their first title at home.",
    1982: "The field expanded to 24 teams.",
    1986: "A defining Maradona tournament.",
    1990: "An emblematic low-scoring World Cup.",
    1994: "The final went all the way to penalties.",
    1998: "The tournament expanded to 32 teams.",
    2002: "The first co-hosted World Cup.",
    2006: "Italy lifted a fourth title.",
    2010: "Spain won their first World Cup.",
    2014: "Germany secured a fourth title.",
    2018: "France won their second title.",
    2022: "The highest-scoring World Cup in this dataset.",
  };
  return notes[item.year] || item.note;
}

function displayCollapseRecord(record) {
  if (currentLocale === "zh") {
    return record;
  }
  return record
    .replace("胜", "W ")
    .replace("平", "D ")
    .replace("负", "L")
    .replace(/(\d)W /g, "$1W ")
    .replace(/(\d)D /g, "$1D ")
    .trim();
}

function displayCollapseNote(item) {
  if (currentLocale === "zh") {
    return item.note;
  }
  const notes = {
    "2014-Spain": "The defending champions went out in the group stage.",
    "1978-Netherlands": "A high-Elo heavyweight still finished without the title.",
    "1982-West Germany": "The tournament opened with the Algeria shock.",
    "2002-France": "The defending champions exited without scoring a goal.",
    "1954-Hungary": "An all-time great side collapsed in the final.",
    "2010-Germany": "A dominant run still stopped short in the semi-finals.",
    "1990-Sweden": "A highly rated side lost all three group matches.",
    "1958-West Germany": "The team visibly dropped off under a brutal schedule.",
  };
  return notes[`${item.year}-${item.team}`] || item.note;
}

function displayVenue(venue) {
  if (currentLocale === "zh") {
    return venue;
  }
  return venueNameMap[venue] || venue;
}

function displayPlayerName(player) {
  if (currentLocale !== "zh") {
    return player;
  }
  return playerNameMap[player] || player;
}

function formatPlayerInline(player) {
  if (currentLocale !== "zh") {
    return player;
  }
  const localized = displayPlayerName(player);
  if (localized === player) {
    return player;
  }
  return `${localized}（${player}）`;
}

function formatPlayerTitle(player) {
  if (currentLocale !== "zh") {
    return player;
  }
  const localized = displayPlayerName(player);
  if (localized === player) {
    return player;
  }
  return `${localized} <span class="story-row__subtle">${player}</span>`;
}

function displayStage(stage) {
  if (currentLocale === "zh") {
    return stage;
  }
  if (/^[A-L]组$/.test(stage)) {
    return `Group ${stage[0]}`;
  }
  const stageMap = {
    揭幕战: "Opening match",
    半决赛: "Semi-finals",
    决赛: "Final",
  };
  return stageMap[stage] || stage;
}

function displayGroupLabel(group) {
  if (currentLocale === "zh") {
    return `${group}${currentUi.groupLabel}`;
  }
  return `${currentUi.groupLabel} ${group}`;
}

function getHomepageMatches() {
  const limit = ["sportmonks-live", "sportmonks-captured", "sportmonks-live-sample"].includes(
    matchdaySourceMeta.provider
  )
    ? 6
    : 4;
  return prioritizeMatches(matches, limit);
}

function getFeaturedMatchId() {
  return prioritizeMatches(matches, 1)[0]?.id || null;
}

function matchPhaseRank(match) {
  if (match.phase === "in_match") {
    return 0;
  }
  if (match.phase === "pre_match") {
    return 1;
  }
  return 2;
}

function matchStageRank(match) {
  const stage = String(match.stage || "");
  if (stage.includes("决赛") || stage.toLowerCase().includes("final")) {
    return 0;
  }
  if (stage.includes("半决赛") || stage.toLowerCase().includes("semi")) {
    return 1;
  }
  return 2;
}

function parseKickoffValue(match) {
  const raw = String(match.kickoff || "").trim();
  if (!raw) {
    return Number.MAX_SAFE_INTEGER;
  }

  const normalized = raw.replace(" ", "T");
  const directValue = Date.parse(normalized);
  if (Number.isFinite(directValue)) {
    return directValue;
  }

  const parsed = normalized.match(
    /^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2})(?::(\d{2}))?)?$/
  );
  if (!parsed) {
    return Number.MAX_SAFE_INTEGER;
  }

  const [, year, month, day, hour = "00", minute = "00", second = "00"] = parsed;
  return Date.UTC(
    Number(year),
    Number(month) - 1,
    Number(day),
    Number(hour),
    Number(minute),
    Number(second)
  );
}

function sortMatchesChronologically(sourceMatches) {
  return [...sourceMatches].sort((a, b) => {
    const kickoffDelta = parseKickoffValue(a) - parseKickoffValue(b);
    if (kickoffDelta !== 0) {
      return kickoffDelta;
    }

    const phaseDelta = matchPhaseRank(a) - matchPhaseRank(b);
    if (phaseDelta !== 0) {
      return phaseDelta;
    }

    return String(a.id).localeCompare(String(b.id));
  });
}

function prioritizeMatches(sourceMatches, limit = 4) {
  return [...sourceMatches]
    .sort((a, b) => {
      const phaseDelta = matchPhaseRank(a) - matchPhaseRank(b);
      if (phaseDelta !== 0) {
        return phaseDelta;
      }

      const stageDelta = matchStageRank(a) - matchStageRank(b);
      if (stageDelta !== 0) {
        return stageDelta;
      }

      const kickoffDelta = parseKickoffValue(a) - parseKickoffValue(b);
      if (kickoffDelta !== 0) {
        return kickoffDelta;
      }

      return String(a.id).localeCompare(String(b.id));
    })
    .slice(0, limit);
}

function renderLineChartSvg(points, label, gradientId) {
  const minValue = Math.min(...points.map((point) => point.elo));
  const maxValue = Math.max(...points.map((point) => point.elo));
  const width = 760;
  const height = 280;
  const padding = 24;
  const xStep = points.length > 1 ? (width - padding * 2) / (points.length - 1) : 0;
  const yScale = (height - padding * 2) / Math.max(1, maxValue - minValue);

  const polyline = points
    .map((point, index) => {
      const x = padding + index * xStep;
      const y = height - padding - (point.elo - minValue) * yScale;
      return `${x},${y}`;
    })
    .join(" ");

  const markers = points
    .filter((_, index) => index === 0 || index === points.length - 1 || index % 6 === 0)
    .map((point) => {
      const index = points.indexOf(point);
      const x = padding + index * xStep;
      const y = height - padding - (point.elo - minValue) * yScale;
      return `<circle cx="${x}" cy="${y}" r="3.5"></circle>`;
    })
    .join("");

  return `
    <svg viewBox="0 0 ${width} ${height}" role="img" aria-label="${label}">
      <defs>
        <linearGradient id="${gradientId}" x1="0%" x2="100%" y1="0%" y2="0%">
          <stop offset="0%" stop-color="#dfa63a"></stop>
          <stop offset="100%" stop-color="#0f5c40"></stop>
        </linearGradient>
      </defs>
      <line x1="${padding}" y1="${height - padding}" x2="${width - padding}" y2="${height - padding}" class="curve-axis"></line>
      <line x1="${padding}" y1="${padding}" x2="${padding}" y2="${height - padding}" class="curve-axis"></line>
      <polyline fill="none" stroke="url(#${gradientId})" stroke-width="4" points="${polyline}" stroke-linecap="round" stroke-linejoin="round"></polyline>
      <g class="curve-markers">${markers}</g>
    </svg>
  `;
}

function renderBarChartSvg(items, label, suffix) {
  const width = 760;
  const height = 320;
  const padding = 24;
  const barGap = 16;
  const maxValue = Math.max(...items.map((item) => item.value));
  const chartHeight = height - padding * 2 - 32;
  const barWidth =
    (width - padding * 2 - barGap * (items.length - 1)) / Math.max(1, items.length);

  const bars = items
    .map((item, index) => {
      const barHeight = (item.value / maxValue) * chartHeight;
      const x = padding + index * (barWidth + barGap);
      const y = height - padding - 24 - barHeight;
      const labelX = x + barWidth / 2;

      return `
        <g>
          <rect x="${x}" y="${y}" width="${barWidth}" height="${barHeight}" rx="10" fill="url(#bar-gradient)"></rect>
          <text x="${labelX}" y="${y - 8}" text-anchor="middle" class="chart-label">${item.value}${suffix}</text>
          <text x="${labelX}" y="${height - padding}" text-anchor="middle" class="chart-axis-label">${item.label}</text>
        </g>
      `;
    })
    .join("");

  return `
    <svg viewBox="0 0 ${width} ${height}" role="img" aria-label="${label}">
      <defs>
        <linearGradient id="bar-gradient" x1="0%" x2="0%" y1="0%" y2="100%">
          <stop offset="0%" stop-color="#dfa63a"></stop>
          <stop offset="100%" stop-color="#0f5c40"></stop>
        </linearGradient>
      </defs>
      <line x1="${padding}" y1="${height - padding - 24}" x2="${width - padding}" y2="${height - padding - 24}" class="curve-axis"></line>
      ${bars}
    </svg>
  `;
}

function calculateMatchup(eloA, eloB) {
  const diff = eloA - eloB;
  const expectedA = 1 / (1 + 10 ** (-diff / 400));
  const draw = clamp(0.28 - Math.abs(diff) / 2000, 0.18, 0.28);
  const homeWin = expectedA * (1 - draw);
  const awayWin = (1 - expectedA) * (1 - draw);
  const knockoutA = homeWin + draw * 0.5;

  return { homeWin, draw, awayWin, knockoutA };
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function formatPct(value) {
  return `${(value * 100).toFixed(1)}%`;
}

function updateCountdown(dayNode, hourNode, minuteNode) {
  const now = new Date();
  const diff = countdownTarget.getTime() - now.getTime();

  if (diff <= 0) {
    dayNode.textContent = "0";
    hourNode.textContent = "0";
    minuteNode.textContent = "0";
    return;
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);

  dayNode.textContent = String(days);
  hourNode.textContent = String(hours).padStart(2, "0");
  minuteNode.textContent = String(minutes).padStart(2, "0");
}

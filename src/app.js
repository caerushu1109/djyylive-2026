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
  wc2026Groups,
  wc2026Matches,
  wc2026PollOptions,
} from "./wc2026-data.js";

const matches = wc2026Matches;
const groups = wc2026Groups;
const pollOptions = wc2026PollOptions;
const countdownTarget = wc2026CountdownTarget;

let activeGroup = "A";
let activeVote = "巴西";
let activeStage = "全部";

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
initTrendsPage();
initLivePage();
initMatchPage();

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

  renderGroupTabs(groupTabs, groupTableBody);
  renderGroupTable(groupTableBody, activeGroup);
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
  const stageSelect = document.querySelector("#schedule-stage-select");
  const teamSelect = document.querySelector("#schedule-team-select");
  const statusSelect = document.querySelector("#schedule-status-select");

  if (!filterNode || !scheduleList) {
    return;
  }

  renderScheduleFilters(filterNode, scheduleList);
  renderScheduleList(scheduleList, activeStage);

  if (liveNowNode) {
    const liveMatches = matches.filter((match) => match.status === "live");
    liveNowNode.innerHTML = liveMatches.length
      ? liveMatches.map(renderMatchSpotlight).join("")
      : renderMatchStateNotice(
          "本届世界杯尚未开赛",
          "现在先看揭幕周和首轮焦点赛程，Live 页面开赛后会自动承担高频入口。"
        );
  }

  if (upcomingNode) {
    upcomingNode.innerHTML = matches
      .filter((match) => match.status === "scheduled")
      .slice(0, 4)
      .map(renderMatchSpotlight)
      .join("");
  }

  if (stageSelect && teamSelect && statusSelect) {
    const teams = [...new Set(matches.flatMap((match) => [match.home, match.away]))].sort();
    const stages = [...new Set(matches.map((match) => match.stage))];

    stageSelect.innerHTML = [`<option value="all">全部阶段</option>`, ...stages.map((stage) => `<option value="${stage}">${stage}</option>`)].join("");
    teamSelect.innerHTML = [`<option value="all">全部球队</option>`, ...teams.map((team) => `<option value="${team}">${team}</option>`)].join("");
    statusSelect.innerHTML = `
      <option value="all">全部状态</option>
      <option value="scheduled">未开始</option>
      <option value="live">进行中</option>
      <option value="finished">已结束</option>
    `;

    const update = () => {
      let filtered = [...matches];
      if (stageSelect.value !== "all") {
        filtered = filtered.filter((match) => match.stage === stageSelect.value);
      }
      if (teamSelect.value !== "all") {
        filtered = filtered.filter(
          (match) => match.home === teamSelect.value || match.away === teamSelect.value
        );
      }
      if (statusSelect.value !== "all") {
        filtered = filtered.filter((match) => match.status === statusSelect.value);
      }
      scheduleList.innerHTML = filtered.map(renderScheduleRow).join("");
    };

    stageSelect.addEventListener("change", update);
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

  const liveMatches = matches.filter((match) => match.status === "live");
  liveNowNode.innerHTML = liveMatches.length
    ? liveMatches.map(renderLiveCard).join("")
    : renderMatchStateNotice(
        "尚未进入比赛日实时阶段",
        "现在更适合先看揭幕战、豪门首秀和小组赛首轮重点比赛。"
      );

  upcomingNode.innerHTML = matches
    .filter((match) => match.status === "scheduled")
    .slice(0, 8)
    .map(renderLiveCard)
    .join("");

  watchlistNode.innerHTML = matches
    .filter(
      (match) =>
        match.id === "wc26-mex-rsa" ||
        match.id === "wc26-fra-sen" ||
        match.id === "wc26-arg-aut" ||
        match.id === "wc26-por-col" ||
        match.stage === "决赛"
    )
    .map(renderWatchlistCard)
    .join("");
}

function initMatchPage() {
  const heroNode = document.querySelector("#match-hero");
  const timelineNode = document.querySelector("#match-timeline");
  const statsNode = document.querySelector("#match-stats");
  const relatedNode = document.querySelector("#match-related");

  if (!heroNode || !timelineNode || !statsNode || !relatedNode) {
    return;
  }

  const matchId = new URLSearchParams(window.location.search).get("id") || matches[0].id;
  const match = matches.find((item) => item.id === matchId) || matches[0];

  heroNode.innerHTML = `
    <div class="match-hero-card">
      <p class="eyebrow">${match.stage}</p>
      <h2>${match.home} vs ${match.away}</h2>
      <p class="hero__lede">${match.kickoff} · ${match.venue} · 当前状态 ${humanizeMatchStatus(match)}</p>
      <div class="match-scoreline">
        <strong>${match.score}</strong>
        <span>${match.minute || "官方赛前信息"}</span>
      </div>
    </div>
  `;

  timelineNode.innerHTML = `
    <article class="event-row"><strong>赛前</strong><span>${match.home} vs ${match.away} 已进入 FIFA 官方赛程。</span></article>
    <article class="event-row"><strong>看点</strong><span>这里后续会接入实时事件流、首发、换人、黄红牌和关键节点。</span></article>
    <article class="event-row"><strong>赛后</strong><span>比赛结束后，这里会沉淀成完整单场档案，并反向链接到球队与历史页。</span></article>
    <article class="event-row"><strong>预留</strong><span>如果是焦点战，还会补前瞻、模型视角和关键球员表现。</span></article>
  `;

  statsNode.innerHTML = `
    <article class="stat-tile"><span>控球</span><strong>54% / 46%</strong></article>
    <article class="stat-tile"><span>射门</span><strong>13 / 10</strong></article>
    <article class="stat-tile"><span>射正</span><strong>6 / 4</strong></article>
    <article class="stat-tile"><span>xG 占位</span><strong>1.4 / 1.1</strong></article>
  `;

  relatedNode.innerHTML = `
    <a class="button button--ghost" href="./schedule.html">回到赛程页</a>
    <a class="button button--ghost" href="./live.html">进入 live 总览</a>
    <a class="button button--ghost" href="./prediction.html">查看预测页</a>
  `;
}

function renderStoryRows(items, formatter) {
  return items
    .map((item, index) => {
      const config = formatter(item, index);
      return `
        <article class="story-row">
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

  const {
    collapsedHeight = 360,
    buttonText = "展开更多",
    buttonTextExpanded = "收起内容",
    itemLabel = "内容",
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
  return `
    <div class="team-profile">
      <div class="team-profile__stats">
        <article class="history-stat">
          <span class="history-stat__label">战绩</span>
          <strong>${profile.wins}-${profile.draws}-${profile.losses}</strong>
          <p>${profile.matches} 场 · ${profile.gf} 进球 · ${profile.ga} 失球</p>
        </article>
        <article class="history-stat">
          <span class="history-stat__label">峰值 ELO</span>
          <strong>${profile.peakElo}</strong>
          <p>${profile.peakDate}</p>
        </article>
        <article class="history-stat">
          <span class="history-stat__label">最近 ELO</span>
          <strong>${profile.latestElo}</strong>
          <p>${profile.latestYear} 年样本</p>
        </article>
      </div>
      <div class="team-profile__notes">
        <article class="sidebar-card">
          <p class="story-card__tag">代表性逆袭</p>
          <h3>${profile.biggestUpsetWin}</h3>
        </article>
        <article class="sidebar-card">
          <p class="story-card__tag">最痛爆冷失利</p>
          <h3>${profile.worstUpsetLoss}</h3>
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

  summaryNode.innerHTML = `
    <article class="summary-pill">
      <strong>最值钱的差异化</strong>
      <span>ELO 让历史页不只告诉你谁赢了，还能解释为什么这场胜负足够反常。</span>
    </article>
    <article class="summary-pill">
      <strong>结构数据补全</strong>
      <span>worldcup 数据库把主办国、球场、球员、奖项和阶段结构全部补成可展示的事实层。</span>
    </article>
    <article class="summary-pill">
      <strong>阅读方式重构</strong>
      <span>首页只做精选和导览，深数据已经拆到独立专题页，整页长度终于可控。</span>
    </article>
  `;

  featureNoteNode.textContent =
    "先看这四块就够了：最极端冷门、最剧烈震荡、最强无冕者，以及历史上最稳定的豪门样本。";

  featuredNode.innerHTML = `
    <article class="feature-card history-mini-card">
      <p class="story-card__tag">Biggest Upset</p>
      <h3>${historyUpsets[0].winner} ${historyUpsets[0].score} ${historyUpsets[0].loser}</h3>
      <p>${historyUpsets[0].date} · 冷门差值 ${historyUpsets[0].eloGap}</p>
      <a href="./history-upsets.html">看完整冷门榜</a>
    </article>
    <article class="feature-card history-mini-card">
      <p class="story-card__tag">Biggest Shockwave</p>
      <h3>${historyShocks[0].home} ${historyShocks[0].score} ${historyShocks[0].away}</h3>
      <p>${historyShocks[0].date} · 单场总波动 ${historyShocks[0].swing}</p>
      <a href="./history-upsets.html">看完整 ELO 冲击波</a>
    </article>
    <article class="feature-card history-mini-card">
      <p class="story-card__tag">Strongest Without Title</p>
      <h3>${bestNeverChampions[0].team}</h3>
      <p>峰值 ELO ${bestNeverChampions[0].peakElo} · 平均 ELO ${bestNeverChampions[0].avgElo}</p>
      <a href="./history-upsets.html">看无冕者列表</a>
    </article>
    <article class="feature-card history-mini-card">
      <p class="story-card__tag">Archive Highlight</p>
      <h3>${archiveVenueAtlas.cities[0].city}</h3>
      <p>${archiveVenueAtlas.cities[0].country} 承办了 ${archiveVenueAtlas.cities[0].matches} 场世界杯比赛。</p>
      <a href="./history-archive.html">看资料库专题</a>
    </article>
  `;

  mountTeamProfileSelect(teamSelect, teamProfileNode, "Brazil");

  championsChartNode.innerHTML = renderBarChartSvg(
    archivePodiumMap
      .slice(0, 6)
      .map((item) => ({ label: item.team, value: item.titles })),
    "世界杯冠军次数",
    "冠"
  );

  goalsChartNode.innerHTML = renderLineChartSvg(
    historyTimeline.map((item) => ({ date: String(item.year), elo: item.goals })),
    "世界杯进球走势",
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

  upsetSummaryNoteNode.textContent = `结论先看：这份 ELO 表里最极端的爆冷是 ${historyUpsets[0].winner} ${historyUpsets[0].score} ${historyUpsets[0].loser}，赛前强弱差达到 ${historyUpsets[0].eloGap}。`;
  shockSummaryNoteNode.textContent = `结论先看：单场 ELO 总波动最大的是 ${historyShocks[0].date} 的 ${historyShocks[0].home} ${historyShocks[0].score} ${historyShocks[0].away}，总震荡 ${historyShocks[0].swing}。`;
  championSummaryNoteNode.textContent = `结论先看：按击败对手平均 ELO 计算，${championStrength[0].year} ${championStrength[0].champion} 是这份模型里“通关含金量”最高的冠军。`;
  neverSummaryNoteNode.textContent = `结论先看：${bestNeverChampions[0].team} 是这份历史样本里最强的无冕者，峰值 ELO 达到 ${bestNeverChampions[0].peakElo}。`;
  collapseSummaryNoteNode.textContent = `结论先看：${collapseRankings[0].year} ${collapseRankings[0].team} 的翻车最具代表性，短赛会制足以让顶级强队迅速失速。`;

  upsetsNode.innerHTML = renderStoryRows(historyUpsets, (item, index) => ({
    lead: index + 1,
    title: `${item.winner} ${item.score} ${item.loser}`,
    copy: `${item.date} · 冷门差值 ${item.eloGap} · 赛前 ELO ${item.winnerElo} vs ${item.loserElo}`,
  }));

  shocksNode.innerHTML = renderStoryRows(historyShocks, (item) => ({
    lead: item.swing,
    metric: true,
    title: `${item.home} ${item.score} ${item.away}`,
    copy: `${item.date} · 赛前 ELO 差 ${item.preGap} · 单场总波动 ${item.swing}`,
  }));

  chaosNode.innerHTML = historyChaos
    .map(
      (item) => `
        <article class="chaos-card">
          <div class="chaos-card__top">
            <strong>${item.year}</strong>
            <span>${item.upsets} 次爆冷</span>
          </div>
          <div class="chaos-card__bars">
            <div>
              <label>ELO 波动</label>
              <div class="mini-bar"><span style="width:${(item.eloSwing / 3342) * 100}%"></span></div>
            </div>
            <div>
              <label>平均进球</label>
              <div class="mini-bar"><span style="width:${(item.avgGoals / 5.38) * 100}%"></span></div>
            </div>
            <div>
              <label>爆冷幅度</label>
              <div class="mini-bar"><span style="width:${(item.avgUpsetGap / 169.6) * 100}%"></span></div>
            </div>
          </div>
          <p>平均进球 ${item.avgGoals} · 平均冷门差值 ${item.avgUpsetGap}</p>
        </article>
      `
    )
    .join("");

  championStrengthNode.innerHTML = renderStoryRows(championStrength, (item, index) => ({
    lead: index + 1,
    title: `${item.year} ${item.champion}`,
    copy: `击败对手平均 ELO ${item.avgDefeatedElo} · 全部对手平均 ELO ${item.avgOppElo}`,
  }));

  neverChampionsNode.innerHTML = renderStoryRows(bestNeverChampions, (item, index) => ({
    lead: index + 1,
    title: item.team,
    copy: `峰值 ELO ${item.peakElo} · 平均 ELO ${item.avgElo} · ${item.matches} 场比赛`,
  }));

  collapseNode.innerHTML = renderStoryRows(collapseRankings, (item, index) => ({
    lead: index + 1,
    title: `${item.year} ${item.team}`,
    copy: `${item.record} · 峰值前 ELO ${item.peakBefore} · 爆冷失利 ${item.upsetLosses} 次 · ELO 跌幅 ${item.eloDrop} · ${item.note}`,
  }));

  setupCollapsibleSection(upsetsNode, { collapsedHeight: 520, itemLabel: "冷门榜" });
  setupCollapsibleSection(shocksNode, { collapsedHeight: 520, itemLabel: "震荡榜" });
  setupCollapsibleSection(championStrengthNode, { collapsedHeight: 420, itemLabel: "冠军含金量" });
  setupCollapsibleSection(neverChampionsNode, { collapsedHeight: 420, itemLabel: "无冕之王" });
  setupCollapsibleSection(collapseNode, { collapsedHeight: 420, itemLabel: "翻车榜" });
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

  archiveSummaryStripNode.innerHTML = `
    <article class="summary-pill">
      <strong>结构层</strong>
      <span>这里不讲 ELO 冷门，只讲比赛系统本身是怎么搭出来的。</span>
    </article>
    <article class="summary-pill">
      <strong>地理层</strong>
      <span>主办国、球场和城市共同定义了世界杯几十年的空间分布。</span>
    </article>
    <article class="summary-pill">
      <strong>赛制层</strong>
      <span>从 13 队到 32 队，世界杯其实经历了多次非常明显的结构转折。</span>
    </article>
  `;

  hostSummaryNoteNode.textContent =
    "结论先看：22 届里有 6 次东道主夺冠，但更多主办国最终止步八强附近，主场优势重要，却不是万能护身符。";
  formatSummaryNoteNode.textContent =
    "结论先看：1974、1978、1982 的赛制最异于常态，而 1998 之后的 32 队结构才是今天球迷最熟悉的版本。";

  archiveHostSummaryNode.innerHTML = renderArchiveChips(archiveHostSummary, (item) => ({
    value: item.value,
    label: item.label,
  }));

  archiveHostsNode.innerHTML = renderStoryRows(archiveHostStory, (item, index) => ({
    lead: index + 1,
    title: `${item.year} ${item.host}`,
    copy: `${item.performance} · 冠军 ${item.winner}${item.hostWon ? " · 东道主直接夺冠" : ""}`,
  }));

  archiveFormatNode.innerHTML = renderStoryRows(archiveFormatEvolution, (item) => ({
    lead: item.teams,
    metric: true,
    title: `${item.year} · ${item.hosts}`,
    copy: `${item.groups} 个小组 / ${item.groupStages} 段小组赛 / ${item.knockoutStages} 段淘汰赛 · ${item.format}`,
  }));

  archiveVenuesNode.innerHTML = `
    <div class="story-lede">出现最多的城市、球场和主办国，能直接看出世界杯的地理重心。</div>
    ${renderArchiveChips(archiveVenueAtlas.hosts, (item) => ({
      value: item.matches,
      label: `${item.country} 承办场次`,
    }))}
    <div class="archive-subpanel">
      <h3>城市 Top 8</h3>
      ${renderStoryRows(archiveVenueAtlas.cities, (item, index) => ({
        lead: index + 1,
        title: `${item.city}, ${item.country}`,
        copy: `${item.matches} 场世界杯比赛`,
      }))}
    </div>
    <div class="archive-subpanel">
      <h3>球场 Top 8</h3>
      ${renderStoryRows(archiveVenueAtlas.stadiums, (item, index) => ({
        lead: index + 1,
        title: item.stadium,
        copy: `${item.city}, ${item.country} · ${item.matches} 场`,
      }))}
    </div>
  `;

  archiveDynastiesNode.innerHTML = renderStoryRows(archiveTeamDynasties, (item, index) => ({
    lead: index + 1,
    title: item.team,
    copy: `${item.titles} 冠 · ${item.topFour} 次四强 · ${item.appearances} 次参赛 · ${item.matches} 场 / ${item.wins} 胜`,
  }));

  archivePodiumNode.innerHTML = `
    <h3>领奖台次数</h3>
    ${renderStoryRows(archivePodiumMap, (item, index) => ({
      lead: index + 1,
      title: item.team,
      copy: `${item.topFour} 次前四 · ${item.titles} 冠 / ${item.runnersUp} 亚 / ${item.thirds} 季`,
    }))}
  `;

  archiveConfederationsNode.innerHTML = renderStoryRows(archiveConfederationReach, (item, index) => ({
    lead: index + 1,
    title: `${item.confederation} · ${item.name}`,
    copy: `${item.teams} 支球队曾参赛 · ${item.appearances} 次晋级届次 · ${item.matches} 场世界杯比赛`,
  }));

  archiveStageEvolutionNode.innerHTML = renderStoryRows(archiveStageEvolution, (item) => ({
    lead: item.stages,
    metric: true,
    title: `${item.year} 赛制结构`,
    copy: `${item.teams} 队 · ${item.groups} 个小组 · ${item.groupStages} 段小组赛 / ${item.knockoutStages} 段淘汰赛`,
  }));

  archiveGroupsNode.innerHTML = `
    <h3>最强小组赛统治力</h3>
    ${renderStoryRows(archiveGroupDominance, (item) => ({
      lead: item.points,
      metric: true,
      title: `${item.year} · ${item.team} · ${item.group}`,
      copy: `${item.points} 分 · 净胜球 ${item.goalDiff} · 进球 ${item.goalsFor}`,
    }))}
  `;

  archiveSubsNode.innerHTML = `
    <h3>换人时代</h3>
    ${renderStoryRows(archiveSubstitutionEras.slice(-8).reverse(), (item) => ({
      lead: item.perMatch,
      metric: true,
      title: `${item.year} 世界杯`,
      copy: `${item.subs} 次换人事件 · 场均 ${item.perMatch}`,
    }))}
  `;

  setupCollapsibleSection(archiveHostsNode, { collapsedHeight: 500, itemLabel: "主办国列表" });
  setupCollapsibleSection(archiveFormatNode, { collapsedHeight: 500, itemLabel: "赛制演化" });
  setupCollapsibleSection(archiveDynastiesNode, { collapsedHeight: 420, itemLabel: "王朝球队" });
  setupCollapsibleSection(archiveConfederationsNode, { collapsedHeight: 360, itemLabel: "洲际版图" });
  setupCollapsibleSection(archiveStageEvolutionNode, { collapsedHeight: 420, itemLabel: "阶段演化" });
  setupCollapsibleSection(archiveGroupsNode, { collapsedHeight: 320, itemLabel: "小组统治力" });
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

  playerSummaryNoteNode.textContent = `结论先看：射手榜顶端是 ${archiveTopScorers[0].player} 的 ${archiveTopScorers[0].goals} 球，出场王是 ${archiveTopAppearances[0].player} 的 ${archiveTopAppearances[0].matches} 场。`;

  archiveScorersNode.innerHTML = renderStoryRows(archiveTopScorers, (item) => ({
    lead: item.goals,
    metric: true,
    title: `${item.player} · ${item.team}`,
    copy: `${item.goals} 球 · ${item.tournaments} 届世界杯`,
  }));

  archiveAppearancesNode.innerHTML = `
    <h3>出场王</h3>
    ${renderStoryRows(archiveTopAppearances, (item) => ({
      lead: item.matches,
      metric: true,
      title: `${item.player} · ${item.team}`,
      copy: `${item.matches} 场 · ${item.tournaments} 届`,
    }))}
  `;

  archiveEvergreensNode.innerHTML = `
    <h3>阵容常青树</h3>
    ${renderStoryRows(archiveSquadEvergreens, (item) => ({
      lead: item.tournaments,
      metric: true,
      title: `${item.player} · ${item.team}`,
      copy: `${item.tournaments} 届入选大名单 · 主位置 ${item.position}`,
    }))}
  `;

  archiveAwardLeadersNode.innerHTML = renderStoryRows(archiveAwardLeaders, (item) => ({
    lead: item.awards,
    metric: true,
    title: `${item.player} · ${item.team}`,
    copy: `${item.awards} 次个人奖项 · ${item.highlights.join(" / ")}`,
  }));

  archiveAwardsNode.innerHTML = `
    <h3>奖项谱系</h3>
    ${renderStoryRows(archiveAwards, (item) => ({
      lead: item.winners,
      metric: true,
      title: item.award,
      copy: `${item.introduced} 年引入 · ${item.description}`,
    }))}
  `;

  archiveManagersNode.innerHTML = renderStoryRows(archiveManagerLegends, (item) => ({
    lead: item.matches,
    metric: true,
    title: `${item.manager} · ${item.country}`,
    copy: `${item.matches} 场执教 · ${item.tournaments} 届世界杯 · 带过 ${item.teams} 支球队`,
  }));

  archiveRefereesNode.innerHTML = `
    <h3>执法场次 Top 10</h3>
    ${renderStoryRows(archiveRefereeLegends, (item) => ({
      lead: item.matches,
      metric: true,
      title: `${item.referee} · ${item.country}`,
      copy: `${item.tournaments} 届世界杯 · ${item.confederation}`,
    }))}
  `;

  setupCollapsibleSection(archiveScorersNode, { collapsedHeight: 500, itemLabel: "射手榜" });
  setupCollapsibleSection(archiveAppearancesNode, { collapsedHeight: 360, itemLabel: "出场王" });
  setupCollapsibleSection(archiveEvergreensNode, { collapsedHeight: 360, itemLabel: "常青树" });
  setupCollapsibleSection(archiveAwardLeadersNode, { collapsedHeight: 360, itemLabel: "奖项领跑者" });
  setupCollapsibleSection(archiveManagersNode, { collapsedHeight: 360, itemLabel: "主帅榜" });
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

  timelineNode.innerHTML = historyTimeline
    .map(
      (item) => `
        <article class="timeline-card">
          <div class="timeline-card__year">${item.year}</div>
          <div class="timeline-card__body">
            <p class="story-card__tag">${item.matches} 场 · ${item.goals} 球</p>
            <h3>${item.champion} 冠军年</h3>
            <p>${item.champion} ${item.score} ${item.runnerUp}</p>
            <p>${item.note}</p>
          </div>
        </article>
      `
    )
    .join("");

  archiveGoalTournamentsNode.innerHTML = renderStoryRows(archiveGoalTournaments, (item) => ({
    lead: item.goals,
    metric: true,
    title: `${item.year} 世界杯`,
    copy: `${item.goals} 球 · ${item.matches} 场`,
  }));

  archiveMilestoneGoalsNode.innerHTML = `
    <h3>最早与最晚进球</h3>
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
    copy: `${item.stage} 点球大战`,
  }));

  archiveCardsNode.innerHTML = renderStoryRows(archiveCardHeavyMatches, (item) => ({
    lead: item.cards,
    metric: true,
    title: `${item.year} · ${item.match}`,
    copy: `${item.stage} · 总牌数 ${item.cards} · 罚下 ${item.reds}`,
  }));

  eventSummaryNoteNode.textContent = `结论先看：进球最多的是 ${archiveGoalTournaments[0].year} 年的 ${archiveGoalTournaments[0].goals} 球，换人密度最高的则是 ${archiveSubstitutionEras[archiveSubstitutionEras.length - 1].year} 年。`;

  setupCollapsibleSection(timelineNode, { collapsedHeight: 560, itemLabel: "冠军时间线" });
  setupCollapsibleSection(archiveShootoutsNode, { collapsedHeight: 360, itemLabel: "点球大战" });
  setupCollapsibleSection(archiveCardsNode, { collapsedHeight: 360, itemLabel: "纪律名场面" });

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

  archiveSummaryStripNode.innerHTML = `
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
  `;

  hostSummaryNoteNode.textContent =
    "结论先看：22 届里有 6 次东道主直接夺冠，但更多主办国实际只能走到八强附近，主场优势很强，但远没有强到稳定保冠。";

  formatSummaryNoteNode.textContent =
    "结论先看：世界杯赛制经历了 13 队、16 队、24 队到 32 队的四次主形态变化，1974、1978、1982 的双阶段结构最不一样。";

  archiveHostSummaryNode.innerHTML = renderArchiveChips(archiveHostSummary, (item) => ({
    value: item.value,
    label: item.label,
  }));

  archiveHostsNode.innerHTML = renderStoryRows(archiveHostStory, (item, index) => ({
    lead: index + 1,
    title: `${item.year} ${item.host}`,
    copy: `${item.performance} · 冠军 ${item.winner}${item.hostWon ? " · 东道主直接夺冠" : ""}`,
  }));

  archiveFormatNode.innerHTML = renderStoryRows(archiveFormatEvolution, (item) => ({
    lead: item.teams,
    metric: true,
    title: `${item.year} · ${item.hosts}`,
    copy: `${item.groups} 个小组 / ${item.groupStages} 段小组赛 / ${item.knockoutStages} 段淘汰赛 · ${item.format}`,
  }));

  archiveVenuesNode.innerHTML = `
    <div class="story-lede">出现最多的城市、球场和主办国，能直接看出世界杯的地理重心。</div>
    ${renderArchiveChips(archiveVenueAtlas.hosts, (item) => ({
      value: item.matches,
      label: `${item.country} 承办场次`,
    }))}
    <div class="archive-subpanel">
      <h3>城市 Top 8</h3>
      ${renderStoryRows(archiveVenueAtlas.cities, (item, index) => ({
        lead: index + 1,
        title: `${item.city}, ${item.country}`,
        copy: `${item.matches} 场世界杯比赛`,
      }))}
    </div>
    <div class="archive-subpanel">
      <h3>球场 Top 8</h3>
      ${renderStoryRows(archiveVenueAtlas.stadiums, (item, index) => ({
        lead: index + 1,
        title: item.stadium,
        copy: `${item.city}, ${item.country} · ${item.matches} 场`,
      }))}
    </div>
  `;

  archiveDynastiesNode.innerHTML = renderStoryRows(archiveTeamDynasties, (item, index) => ({
    lead: index + 1,
    title: item.team,
    copy: `${item.titles} 冠 · ${item.topFour} 次四强 · ${item.appearances} 次参赛 · ${item.matches} 场 / ${item.wins} 胜`,
  }));

  archivePodiumNode.innerHTML = `
    <h3>领奖台次数</h3>
    ${renderStoryRows(archivePodiumMap, (item, index) => ({
      lead: index + 1,
      title: item.team,
      copy: `${item.topFour} 次前四 · ${item.titles} 冠 / ${item.runnersUp} 亚 / ${item.thirds} 季`,
    }))}
  `;

  archiveConfederationsNode.innerHTML = renderStoryRows(
    archiveConfederationReach,
    (item, index) => ({
      lead: index + 1,
      title: `${item.confederation} · ${item.name}`,
      copy: `${item.teams} 支球队曾参赛 · ${item.appearances} 次晋级届次 · ${item.matches} 场世界杯比赛`,
    })
  );

  upsetSummaryNoteNode.textContent = `结论先看：这份 ELO 表里最极端的爆冷是 ${historyUpsets[0].winner} ${historyUpsets[0].score} ${historyUpsets[0].loser}，赛前强弱差达到 ${historyUpsets[0].eloGap}。`;

  shockSummaryNoteNode.textContent = `结论先看：单场 ELO 总波动最大的是 ${historyShocks[0].date} 的 ${historyShocks[0].home} ${historyShocks[0].score} ${historyShocks[0].away}，总震荡 ${historyShocks[0].swing}。`;

  timelineNode.innerHTML = historyTimeline
    .map(
      (item) => `
        <article class="timeline-card">
          <div class="timeline-card__year">${item.year}</div>
          <div class="timeline-card__body">
            <p class="story-card__tag">${item.matches} 场 · ${item.goals} 球</p>
            <h3>${item.champion} 冠军年</h3>
            <p>${item.champion} ${item.score} ${item.runnerUp}</p>
            <p>${item.note}</p>
          </div>
        </article>
      `
    )
    .join("");

  archiveScorersNode.innerHTML = renderStoryRows(archiveTopScorers, (item, index) => ({
    lead: item.goals,
    metric: true,
    title: `${item.player} · ${item.team}`,
    copy: `${item.goals} 球 · ${item.tournaments} 届世界杯`,
  }));

  archiveAppearancesNode.innerHTML = `
    <h3>出场王</h3>
    ${renderStoryRows(archiveTopAppearances, (item, index) => ({
      lead: item.matches,
      metric: true,
      title: `${item.player} · ${item.team}`,
      copy: `${item.matches} 场 · ${item.tournaments} 届`,
    }))}
  `;

  archiveEvergreensNode.innerHTML = `
    <h3>阵容常青树</h3>
    ${renderStoryRows(archiveSquadEvergreens, (item, index) => ({
      lead: item.tournaments,
      metric: true,
      title: `${item.player} · ${item.team}`,
      copy: `${item.tournaments} 届入选大名单 · 主位置 ${item.position}`,
    }))}
  `;

  playerSummaryNoteNode.textContent = `结论先看：射手榜顶端是 ${archiveTopScorers[0].player} 的 ${archiveTopScorers[0].goals} 球，出场王是 ${archiveTopAppearances[0].player} 的 ${archiveTopAppearances[0].matches} 场，世界杯人物层已经能单独撑起一套资料页。`;

  archiveAwardLeadersNode.innerHTML = renderStoryRows(
    archiveAwardLeaders,
    (item, index) => ({
      lead: item.awards,
      metric: true,
      title: `${item.player} · ${item.team}`,
      copy: `${item.awards} 次个人奖项 · ${item.highlights.join(" / ")}`,
    })
  );

  archiveAwardsNode.innerHTML = `
    <h3>奖项谱系</h3>
    ${renderStoryRows(archiveAwards, (item, index) => ({
      lead: item.winners,
      metric: true,
      title: `${item.award}`,
      copy: `${item.introduced} 年引入 · ${item.description}`,
    }))}
  `;

  archiveManagersNode.innerHTML = renderStoryRows(
    archiveManagerLegends,
    (item, index) => ({
      lead: item.matches,
      metric: true,
      title: `${item.manager} · ${item.country}`,
      copy: `${item.matches} 场执教 · ${item.tournaments} 届世界杯 · 带过 ${item.teams} 支球队`,
    })
  );

  archiveRefereesNode.innerHTML = `
    <h3>执法场次 Top 10</h3>
    ${renderStoryRows(archiveRefereeLegends, (item, index) => ({
      lead: item.matches,
      metric: true,
      title: `${item.referee} · ${item.country}`,
      copy: `${item.tournaments} 届世界杯 · ${item.confederation}`,
    }))}
  `;

  upsetsNode.innerHTML = historyUpsets
    .map(
      (item, index) => `
        <article class="story-row">
          <span class="story-row__index">${index + 1}</span>
          <div class="story-row__body">
            <strong>${item.winner} ${item.score} ${item.loser}</strong>
            <p>${item.date} · 冷门差值 ${item.eloGap} · 赛前 ELO ${item.winnerElo} vs ${item.loserElo}</p>
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
            <strong>${item.home} ${item.score} ${item.away}</strong>
            <p>${item.date} · 赛前 ELO 差 ${item.preGap} · 单场总波动 ${item.swing}</p>
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
            <span>${item.upsets} 次爆冷</span>
          </div>
          <div class="chaos-card__bars">
            <div>
              <label>ELO 波动</label>
              <div class="mini-bar"><span style="width:${(item.eloSwing / 3342) * 100}%"></span></div>
            </div>
            <div>
              <label>平均进球</label>
              <div class="mini-bar"><span style="width:${(item.avgGoals / 5.38) * 100}%"></span></div>
            </div>
            <div>
              <label>爆冷幅度</label>
              <div class="mini-bar"><span style="width:${(item.avgUpsetGap / 169.6) * 100}%"></span></div>
            </div>
          </div>
          <p>平均进球 ${item.avgGoals} · 平均冷门差值 ${item.avgUpsetGap}</p>
        </article>
      `
    )
    .join("");

  archiveGoalTournamentsNode.innerHTML = renderStoryRows(
    archiveGoalTournaments,
    (item, index) => ({
      lead: item.goals,
      metric: true,
      title: `${item.year} 世界杯`,
      copy: `${item.goals} 球 · ${item.matches} 场`,
    })
  );

  archiveMilestoneGoalsNode.innerHTML = `
    <h3>最早与最晚进球</h3>
    ${renderStoryRows(archiveMilestoneGoals.earliest, (item) => ({
      lead: item.label,
      metric: true,
      title: `${item.year} · ${item.player}`,
      copy: `${item.match}`,
    }))}
    ${renderStoryRows(archiveMilestoneGoals.latest, (item) => ({
      lead: item.label,
      metric: true,
      title: `${item.year} · ${item.player}`,
      copy: `${item.match}`,
    }))}
  `;

  archiveShootoutsNode.innerHTML = renderStoryRows(
    archiveShootoutMatches,
    (item, index) => ({
      lead: item.score,
      metric: true,
      title: `${item.year} · ${item.match}`,
      copy: `${item.stage} 点球大战`,
    })
  );

  archiveCardsNode.innerHTML = `
    <h3>火药味最重的比赛</h3>
    ${renderStoryRows(archiveCardHeavyMatches, (item) => ({
      lead: item.cards,
      metric: true,
      title: `${item.year} · ${item.match}`,
      copy: `${item.stage} · 总牌数 ${item.cards} · 罚下 ${item.reds}`,
    }))}
  `;

  archiveStageEvolutionNode.innerHTML = renderStoryRows(
    archiveStageEvolution,
    (item) => ({
      lead: item.stages,
      metric: true,
      title: `${item.year} 赛制结构`,
      copy: `${item.teams} 队 · ${item.groups} 个小组 · ${item.groupStages} 段小组赛 / ${item.knockoutStages} 段淘汰赛`,
    })
  );

  archiveGroupsNode.innerHTML = `
    <h3>最强小组赛统治力</h3>
    ${renderStoryRows(archiveGroupDominance, (item) => ({
      lead: item.points,
      metric: true,
      title: `${item.year} · ${item.team} · ${item.group}`,
      copy: `${item.points} 分 · 净胜球 ${item.goalDiff} · 进球 ${item.goalsFor}`,
    }))}
  `;

  archiveSubsNode.innerHTML = `
    <h3>换人时代</h3>
    ${renderStoryRows(
      archiveSubstitutionEras.slice(-8).reverse(),
      (item) => ({
        lead: item.perMatch,
        metric: true,
        title: `${item.year} 世界杯`,
        copy: `${item.subs} 次换人事件 · 场均 ${item.perMatch}`,
      })
    )}
  `;

  eventSummaryNoteNode.textContent = `结论先看：进球最多的是 ${archiveGoalTournaments[0].year} 年的 ${archiveGoalTournaments[0].goals} 球，换人密度最高的则是 ${archiveSubstitutionEras[archiveSubstitutionEras.length - 1].year} 年，世界杯已经明显进入高轮换时代。`;

  chartChampionsNode.innerHTML = renderBarChartSvg(
    archivePodiumMap
      .slice(0, 8)
      .map((item) => ({ label: item.team, value: item.titles })),
    "世界杯冠军分布",
    "冠"
  );

  chartFormatNode.innerHTML = renderLineChartSvg(
    archiveStageEvolution.map((item) => ({ date: String(item.year), elo: item.teams })),
    "世界杯参赛队规模演化",
    "history-format-gradient"
  );

  chartConfederationsNode.innerHTML = renderBarChartSvg(
    archiveConfederationReach.map((item) => ({
      label: item.confederation,
      value: item.appearances,
    })),
    "世界杯洲际参赛量",
    "次"
  );

  chartGoalsNode.innerHTML = renderLineChartSvg(
    historyTimeline.map((item) => ({ date: String(item.year), elo: item.goals })),
    "世界杯总进球走势",
    "history-goals-gradient"
  );

  chartSubsNode.innerHTML = renderLineChartSvg(
    archiveSubstitutionEras.map((item) => ({ date: String(item.year), elo: item.perMatch })),
    "世界杯换人时代走势",
    "history-subs-gradient"
  );

  chartHostsNode.innerHTML = renderBarChartSvg(
    archiveHostSummary.map((item) => ({ label: item.label, value: item.value })).slice(0, 8),
    "东道主成绩分布",
    ""
  );

  championSummaryNoteNode.textContent = `结论先看：按击败对手平均 ELO 计算，${championStrength[0].year} ${championStrength[0].champion} 是这份模型里“通关含金量”最高的冠军。`;
  neverSummaryNoteNode.textContent = `结论先看：${bestNeverChampions[0].team} 依然是这份历史样本里最强的无冕者，峰值 ELO 达到 ${bestNeverChampions[0].peakElo}。`;
  collapseSummaryNoteNode.textContent = `结论先看：${collapseRankings[0].year} ${collapseRankings[0].team} 的翻车最具代表性，说明顶级强队也会在短赛会制里迅速失速。`;

  championStrengthNode.innerHTML = championStrength
    .map(
      (item, index) => `
        <article class="story-row">
          <span class="story-row__index">${index + 1}</span>
          <div class="story-row__body">
            <strong>${item.year} ${item.champion}</strong>
            <p>击败对手平均 ELO ${item.avgDefeatedElo} · 全部对手平均 ELO ${item.avgOppElo}</p>
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
            <strong>${item.team}</strong>
            <p>峰值 ELO ${item.peakElo} · 平均 ELO ${item.avgElo} · ${item.matches} 场比赛</p>
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
            <strong>${item.year} ${item.team}</strong>
            <p>${item.record} · 峰值前 ELO ${item.peakBefore} · 爆冷失利 ${item.upsetLosses} 次 · ELO 跌幅 ${item.eloDrop}</p>
            <p>${item.note}</p>
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
            <span class="history-stat__label">战绩</span>
            <strong>${profile.wins}-${profile.draws}-${profile.losses}</strong>
            <p>${profile.matches} 场 · ${profile.gf} 进球 · ${profile.ga} 失球</p>
          </article>
          <article class="history-stat">
            <span class="history-stat__label">峰值 ELO</span>
            <strong>${profile.peakElo}</strong>
            <p>${profile.peakDate}</p>
          </article>
          <article class="history-stat">
            <span class="history-stat__label">最近 ELO</span>
            <strong>${profile.latestElo}</strong>
            <p>${profile.latestYear} 年样本</p>
          </article>
        </div>
        <div class="team-profile__notes">
          <article class="sidebar-card">
            <p class="story-card__tag">代表性逆袭</p>
            <h3>${profile.biggestUpsetWin}</h3>
          </article>
          <article class="sidebar-card">
            <p class="story-card__tag">最痛爆冷失利</p>
            <h3>${profile.worstUpsetLoss}</h3>
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

  setupCollapsibleSection(archiveHostsNode, { collapsedHeight: 420, itemLabel: "主办国列表" });
  setupCollapsibleSection(archiveFormatNode, { collapsedHeight: 420, itemLabel: "赛制演化" });
  setupCollapsibleSection(archiveDynastiesNode, { collapsedHeight: 420, itemLabel: "王朝球队" });
  setupCollapsibleSection(archiveConfederationsNode, { collapsedHeight: 360, itemLabel: "洲际版图" });
  setupCollapsibleSection(upsetsNode, { collapsedHeight: 420, itemLabel: "冷门榜" });
  setupCollapsibleSection(shocksNode, { collapsedHeight: 420, itemLabel: "震荡榜" });
  setupCollapsibleSection(archiveScorersNode, { collapsedHeight: 420, itemLabel: "射手榜" });
  setupCollapsibleSection(archiveAppearancesNode, { collapsedHeight: 360, itemLabel: "出场王" });
  setupCollapsibleSection(archiveEvergreensNode, { collapsedHeight: 360, itemLabel: "常青树" });
  setupCollapsibleSection(archiveAwardLeadersNode, { collapsedHeight: 360, itemLabel: "奖项领跑者" });
  setupCollapsibleSection(archiveAwardsNode, { collapsedHeight: 320, itemLabel: "奖项谱系" });
  setupCollapsibleSection(archiveManagersNode, { collapsedHeight: 360, itemLabel: "主帅榜" });
  setupCollapsibleSection(archiveRefereesNode, { collapsedHeight: 360, itemLabel: "裁判榜" });
  setupCollapsibleSection(archiveGoalTournamentsNode, { collapsedHeight: 360, itemLabel: "高进球届次" });
  setupCollapsibleSection(archiveMilestoneGoalsNode, { collapsedHeight: 360, itemLabel: "里程碑进球" });
  setupCollapsibleSection(archiveShootoutsNode, { collapsedHeight: 360, itemLabel: "点球大战" });
  setupCollapsibleSection(archiveCardsNode, { collapsedHeight: 360, itemLabel: "纪律名场面" });
  setupCollapsibleSection(archiveStageEvolutionNode, { collapsedHeight: 360, itemLabel: "阶段演化" });
  setupCollapsibleSection(archiveGroupsNode, { collapsedHeight: 320, itemLabel: "小组统治力" });
  setupCollapsibleSection(archiveSubsNode, { collapsedHeight: 320, itemLabel: "换人时代" });
  setupCollapsibleSection(championStrengthNode, { collapsedHeight: 360, itemLabel: "冠军含金量" });
  setupCollapsibleSection(neverChampionsNode, { collapsedHeight: 360, itemLabel: "无冕之王" });
  setupCollapsibleSection(collapseNode, { collapsedHeight: 360, itemLabel: "翻车榜" });
  setupCollapsibleSection(timelineNode, { collapsedHeight: 520, itemLabel: "冠军时间线" });

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

  gridNode.innerHTML = featuredTeams
    .map((team) => {
      const profile = teamProfiles[team];
      if (!profile) {
        return "";
      }
      return `
        <article class="feature-card history-mini-card">
          <p class="story-card__tag">${team}</p>
          <h3>${team}</h3>
          <p>${profile.matches} 场世界杯比赛 · 峰值 ELO ${profile.peakElo} · ${profile.wins} 胜</p>
          <a href="./team-history.html?team=${encodeURIComponent(team)}">进入球队深页</a>
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
    factsNode.innerHTML = `
      <article class="summary-pill">
        <strong>峰值 ELO</strong>
        <span>${profile.peakElo} · ${profile.peakDate}</span>
      </article>
      <article class="summary-pill">
        <strong>总战绩</strong>
        <span>${profile.wins}-${profile.draws}-${profile.losses}</span>
      </article>
      <article class="summary-pill">
        <strong>代表性逆袭</strong>
        <span>${profile.biggestUpsetWin}</span>
      </article>
    `;

    linksNode.innerHTML = `
      <article class="schedule-row">
        <div>
          <strong>${team} 全部世界杯比赛</strong>
          <p>进入单队比赛档案页</p>
        </div>
        <a class="button button--ghost" href="./team-history.html?team=${encodeURIComponent(team)}">查看深页</a>
      </article>
      <article class="schedule-row">
        <div>
          <strong>${team} ELO 曲线</strong>
          <p>查看完整趋势页里的更多图表</p>
        </div>
        <a class="button button--ghost" href="./trends.html">查看趋势</a>
      </article>
      <article class="schedule-row">
        <div>
          <strong>${team} 历史专题</strong>
          <p>结合历史页与比赛浏览器继续深入</p>
        </div>
        <a class="button button--ghost" href="./history-matches.html">查看比赛史</a>
      </article>
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
      curveMetaNode.innerHTML = `<strong>${curveSelectNode.value}</strong><span>暂无曲线数据</span>`;
      return;
    }
    curveNode.innerHTML = renderLineChartSvg(points, `${curveSelectNode.value} curve`, "teams-hub-curve-gradient");
    curveMetaNode.innerHTML = `
      <strong>${curveSelectNode.value}</strong>
      <span>最低 ${Math.min(...points.map((point) => point.elo))} · 最高 ${Math.max(...points.map((point) => point.elo))} · 样本 ${points.length} 场</span>
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
    `<option value="all">全部届次</option>`,
    ...historyExplorerYears.map((year) => `<option value="${year}">${year}</option>`),
  ].join("");
  teamSelect.innerHTML = [
    `<option value="all">全部球队</option>`,
    ...historyExplorerTeams.map((team) => `<option value="${team}">${team}</option>`),
  ].join("");
  upsetSelect.innerHTML = `
    <option value="all">全部比赛</option>
    <option value="upset">只看爆冷</option>
    <option value="non-upset">排除爆冷</option>
  `;
  sortSelect.innerHTML = `
    <option value="date-desc">按时间倒序</option>
    <option value="elo-gap">按 ELO 差排序</option>
    <option value="swing">按波动排序</option>
    <option value="goals">按总进球排序</option>
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

    metaNode.textContent = `当前结果：${matches.length} 场比赛`;

    listNode.innerHTML = matches
      .slice(0, 48)
      .map(
        (match) => `
          <article class="explorer-row">
            <div class="explorer-row__top">
              <strong>${match.home} ${match.homeGoals}:${match.awayGoals} ${match.away}</strong>
              <span>${match.date}</span>
            </div>
            <div class="explorer-row__meta">
              <span>${match.upset ? "爆冷" : "常规结果"}</span>
              <span>ELO 差 ${match.eloGap}</span>
              <span>波动 ${match.swing}</span>
              <span>赛前 ${match.homeEloBefore} vs ${match.awayEloBefore}</span>
            </div>
          </article>
        `
      )
      .join("");

    setupCollapsibleSection(listNode, {
      collapsedHeight: 540,
      buttonText: "展开更多比赛",
      buttonTextExpanded: "收起比赛列表",
      itemLabel: "历史比赛浏览器",
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
      metaNode.textContent = "没有可展示的 ELO 曲线数据。";
      return;
    }
    chartNode.innerHTML = renderLineChartSvg(points, `${teamSelect.value} ELO curve`, "curve-gradient");

    metaNode.innerHTML = `
      <strong>${teamSelect.value}</strong>
      <span>最低 ${Math.min(...points.map((point) => point.elo))} · 最高 ${Math.max(...points.map((point) => point.elo))} · 样本 ${points.length} 场</span>
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
    summaryNode.innerHTML = `
      ${profile ? renderTeamProfileMarkup(profile) : ""}
      <div class="team-profile">
        <div class="team-profile__stats">
          <article class="history-stat">
            <span class="history-stat__label">总战绩</span>
            <strong>${wins}-${draws}-${losses}</strong>
            <p>${matches.length} 场世界杯比赛</p>
          </article>
          <article class="history-stat">
            <span class="history-stat__label">进失球</span>
            <strong>${gf}:${ga}</strong>
            <p>净胜球 ${gf - ga}</p>
          </article>
          <article class="history-stat">
            <span class="history-stat__label">爆冷表现</span>
            <strong>${upsets}/${upsetLosses}</strong>
            <p>爆冷赢球 / 被爆冷输球</p>
          </article>
        </div>
      </div>
    `;

    matchesNode.innerHTML = matches
      .map(
        (match) => `
          <article class="explorer-row">
            <div class="explorer-row__top">
              <strong>${match.home} ${match.homeGoals}:${match.awayGoals} ${match.away}</strong>
              <span>${match.date}</span>
            </div>
            <div class="explorer-row__meta">
              <span>${match.upset ? "爆冷" : "常规结果"}</span>
              <span>ELO 差 ${match.eloGap}</span>
              <span>波动 ${match.swing}</span>
            </div>
          </article>
        `
      )
      .join("");

    const curvePoints = historyCurves[team] || [];
    if (curvePoints.length) {
      curveNode.innerHTML = renderLineChartSvg(
        curvePoints,
        `${team} history curve`,
        "curve-gradient-alt"
      );
      curveMetaNode.innerHTML = `
        <strong>${team}</strong>
        <span>最低 ${Math.min(...curvePoints.map((point) => point.elo))} · 最高 ${Math.max(...curvePoints.map((point) => point.elo))} · 样本 ${curvePoints.length} 场</span>
      `;
    } else {
      curveNode.innerHTML = `<div class="matchup-placeholder">这支球队没有现成的 ELO 轨迹图。</div>`;
      curveMetaNode.innerHTML = `<strong>${team}</strong><span>暂无曲线样本</span>`;
    }

    linksNode.innerHTML = `
      <li><strong>球队首页：</strong><a href="./teams.html">回到球队入口页</a></li>
      <li><strong>历史匹配：</strong><a href="./history-matches.html">查看完整历史比赛浏览器</a></li>
      <li><strong>趋势比较：</strong><a href="./trends.html">进入趋势图页</a></li>
      <li><strong>换另一队：</strong><a href="./team-history.html?team=Brazil">快速切到巴西</a></li>
    `;

    const nextUrl = new URL(window.location.href);
    nextUrl.searchParams.set("team", team);
    window.history.replaceState({}, "", nextUrl);
  };

  teamSelect.addEventListener("change", update);
  sortSelect.addEventListener("change", update);
  update();
}

function initTrendsPage() {
  const championsNode = document.querySelector("#chart-champions");
  const goalsNode = document.querySelector("#chart-goals");
  const chaosNode = document.querySelector("#chart-chaos");
  const neverNode = document.querySelector("#chart-never");

  if (!championsNode || !goalsNode || !chaosNode || !neverNode) {
    return;
  }

  const championCounts = Object.entries(
    historyTimeline.reduce((accumulator, item) => {
      accumulator[item.champion] = (accumulator[item.champion] || 0) + 1;
      return accumulator;
    }, {})
  )
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([label, value]) => ({ label, value }));

  championsNode.innerHTML = renderBarChartSvg(
    championCounts,
    "冠军次数分布",
    "次"
  );

  goalsNode.innerHTML = renderLineChartSvg(
    historyTimeline.map((item) => ({ date: String(item.year), elo: item.goals })),
    "历届总进球趋势",
    "curve-gradient"
  );

  chaosNode.innerHTML = renderLineChartSvg(
    historyChaos
      .slice()
      .reverse()
      .map((item) => ({ date: String(item.year), elo: item.eloSwing })),
    "混乱指数走势",
    "curve-gradient-alt"
  );

  neverNode.innerHTML = renderBarChartSvg(
    bestNeverChampions.slice(0, 8).map((item) => ({
      label: item.team,
      value: item.peakElo,
    })),
    "最强未夺冠球队峰值 ELO",
    "ELO"
  );
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

  assumptionsNode.innerHTML = modelAssumptions
    .map((item) => `<li>${item}</li>`)
    .join("");

  oddsNode.innerHTML = titleOdds
    .map(
      (item) => `
        <article class="odds-row">
          <div>
            <strong>${item.team}</strong>
            <span>简化争冠概率</span>
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
        `<option value="${item.team}">${item.team} · ELO ${item.elo}</option>`
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
          请选择两支不同的球队。
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
          <h3>${teamA.team} vs ${teamB.team}</h3>
          <p>ELO 差值：${teamA.elo - teamB.elo}</p>
        </div>
        <div class="probability-grid">
          <article class="probability-card">
            <span>${teamA.team} 胜</span>
            <strong>${formatPct(homeWin)}</strong>
          </article>
          <article class="probability-card">
            <span>平局</span>
            <strong>${formatPct(draw)}</strong>
          </article>
          <article class="probability-card">
            <span>${teamB.team} 胜</span>
            <strong>${formatPct(awayWin)}</strong>
          </article>
        </div>
        <div class="knockout-card">
          <span>淘汰赛晋级概率</span>
          <strong>${teamA.team} ${formatPct(knockoutA)}</strong>
          <strong>${teamB.team} ${formatPct(1 - knockoutA)}</strong>
        </div>
      </div>
    `;
  };

  teamASelect.addEventListener("change", update);
  teamBSelect.addEventListener("change", update);
  update();
}

function renderMatchCard(match) {
  return `
    <article class="match-card">
      <span class="match-card__stage">${match.stage} · ${humanizeMatchStatus(match)}</span>
      <div class="match-card__teams">
        <div class="match-card__team">
          <span>主队</span>
          <strong>${match.home}</strong>
        </div>
        <div class="match-card__score">${match.score}</div>
        <div class="match-card__team">
          <span>客队</span>
          <strong>${match.away}</strong>
        </div>
      </div>
      <p class="match-card__meta">${match.meta}</p>
    </article>
  `;
}

function renderGroupTabs(groupTabs, groupTableBody) {
  groupTabs.innerHTML = Object.keys(groups)
    .map(
      (group) => `
        <button
          class="group-tab"
          type="button"
          role="tab"
          aria-selected="${group === activeGroup}"
          data-group="${group}"
        >
          ${group}组
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
  groupTableBody.innerHTML = groups[groupKey]
    .map(
      (team) => `
        <tr>
          <td><strong>${team.team}</strong></td>
          <td>${team.played}</td>
          <td>${team.win}</td>
          <td>${team.draw}</td>
          <td>${team.loss}</td>
          <td>${team.points}</td>
        </tr>
      `
    )
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
            ${option.label}
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
  const stages = ["全部", ...new Set(matches.map((match) => match.stage))];

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
          ${stage}
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
    stage === "全部"
      ? matches
      : matches.filter((match) => match.stage === stage);

  scheduleList.innerHTML = visibleMatches.map(renderScheduleRow).join("");
}

function renderRankingList(items) {
  return items
    .map(
      (item, index) => `
        <article class="ranking-row">
          <span class="ranking-row__index">${index + 1}</span>
          <strong>${item.team}</strong>
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
  return `
    <article class="schedule-row">
      <div>
        <strong>${match.home} vs ${match.away}</strong>
        <p>${match.stage} · ${match.venue} · ${match.kickoff} · ${humanizeMatchStatus(match)} ${match.minute || ""}</p>
      </div>
      <div class="schedule-row__actions">
        <a class="button button--ghost" href="./match.html?id=${match.id}">比赛详情</a>
        <a class="button button--ghost" href="./article.html">前瞻文章</a>
      </div>
    </article>
  `;
}

function renderMatchSpotlight(match) {
  return `
    <article class="spotlight-match">
      <div>
        <p class="story-card__tag">${humanizeMatchStatus(match)}</p>
        <h3>${match.home} vs ${match.away}</h3>
        <p>${match.kickoff} · ${match.venue}</p>
      </div>
      <a class="button button--ghost" href="./match.html?id=${match.id}">查看比赛</a>
    </article>
  `;
}

function renderMatchStateNotice(title, copy) {
  return `
    <article class="feature-card history-mini-card">
      <p class="story-card__tag">Pre-Tournament</p>
      <h3>${title}</h3>
      <p>${copy}</p>
      <a href="./schedule.html">查看完整赛程</a>
    </article>
  `;
}

function renderLiveCard(match) {
  return `
    <article class="live-card">
      <div class="live-card__top">
        <span class="live-pill ${match.status === "live" ? "is-live" : ""}">${humanizeMatchStatus(match)}</span>
        <span>${match.stage}</span>
      </div>
      <h3>${match.home} ${match.score} ${match.away}</h3>
      <p>${match.kickoff} · ${match.venue}</p>
      <div class="live-card__actions">
        <a class="button button--ghost" href="./match.html?id=${match.id}">打开比赛页</a>
      </div>
    </article>
  `;
}

function renderWatchlistCard(match) {
  return `
    <article class="watchlist-row">
      <strong>${match.home} vs ${match.away}</strong>
      <span>${match.stage} · ${match.kickoff}</span>
    </article>
  `;
}

function humanizeMatchStatus(match) {
  if (match.status === "live") {
    return match.minute ? `进行中 ${match.minute}` : "进行中";
  }
  if (match.status === "finished") {
    return "已结束";
  }
  return "未开始";
}

function getHomepageMatches() {
  const highlightIds = [
    "wc26-mex-rsa",
    "wc26-bra-hai",
    "wc26-fra-sen",
    "wc26-eng-cro",
  ];

  return highlightIds
    .map((id) => matches.find((match) => match.id === id))
    .filter(Boolean);
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

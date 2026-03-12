# SportMonks 字段清单

这份清单只服务当前这版移动端产品：

- `index.html`：只显示正在进行 / 即将到来的比赛
- `live.html`：实时数据 + 我们自己的实时观点
- `opinion.html`：赛前观点 + Elo + 历史背景

## 一、`live` 页现在优先使用的基础字段

这些字段是当前 V1 最值得先接、风险最低的：

### 比赛头部
- `participants`
- `scores`
- `state`
- `starting_at`
- `venue`
- `details`
- `round`

### 事件流
- `events`
- `events.type`

### 关键统计
- `statistics`
- `statistics.type`

### 阵容
- `lineups`
- `lineups.details.type`
- `formations`（如果当前订阅可用）

### 辅助信息
- `referees`（如果当前订阅可用）
- `weatherReport`（如果当前订阅可用）

## 二、`opinion` 页现在优先使用的字段

### 来自 SportMonks
- `participants`
- `starting_at`
- `state`
- `venue`
- `details`
- `round`
- `group`
- `lineups`

### 来自我们自己
- Elo 强度
- 世界杯历史履历
- 历史亮点
- 核心观点文案

## 三、待单独验证的高级字段

这些不要默认认为当前套餐一定有，要逐项验证：

### 1. `expectedLineups`
用途：
- 赛前观点页里显示预计首发
- live 页赛前状态里显示“预计阵容已出 / 未出”

### 2. `sidelined`
用途：
- 赛前观点页里显示缺席 / 伤停
- live 页补充名单可用性

### 3. `predictions`
用途：
- 可作为外部信号参考
- 不直接显示“赔率”或敏感表达

### 4. `odds`
用途：
- 只能作为内部验证或弱化后的“市场倾向”
- 不建议直接以赔率样式放到前台

## 四、验证顺序

最稳的顺序是：

1. 先把 `live` 页按基础 live 数据做完整
2. 再单独验证：
   - `expectedLineups`
   - `sidelined`
   - `predictions`
   - `odds`

## 五、当前产品决策

- 页面文案统一使用 `观点`
- 避免出现：
  - `推荐`
  - `博彩`
  - `赔率`
- `live` 页和 `opinion` 页风格可以不同
- 所有移动端页面优先避免超长纵向滚动
- 复杂信息优先用小按钮切换内容块

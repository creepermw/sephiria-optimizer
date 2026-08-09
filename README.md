# Sephiria 配装优化器

输入背包里有的神器/石板与背包大小, 自动求出收益最高的摆放方案。

在线使用: https://creepermw.github.io/sephiria-optimizer/

## 功能

- 背包大小(宽×高)与流派权重设置
- 勾选你拥有的神器(72 个内置, 含稀有度/效果/相对价值)
- 石板效果自定义(5×5 网格编辑器, 支持旋转)
- 两阶段 Beam Search 求解最优摆放(物品+石板位置与旋转)
- 分享链接: 一键复制带状态的 URL, 其他玩家打开即恢复你的背包配置

## 数据来源

- sephiria.miraheze.org (46 个神器, 结构化 infobox)
- NGA 玩家数据测算帖 (中文名/效果/稀有度)
- konachangame.com 简易图鉴 (石板名)

物品价值(value)为按效果文本的相对估算, 非官方公式。

## 部署

纯静态站, 无构建: index.html + style.css + data.js + app.js

```
git push origin main
# GitHub Pages: Settings -> Pages -> Deploy from branch: main / root
```

## 数据贡献

游戏内按 `ESC -> 日志 -> 石板` 可查看已解锁石板的真实效果。
把石板效果填进 `data.js` 的 `TABLETS` 条目(`cells: [{dx, dy, lv}]`), 或提交 issue。

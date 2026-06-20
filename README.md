# DNA 双螺旋探索器 / Explorateur de la double hélice d'ADN

面向高中和大学低年级生物教学的中法双语交互式 DNA 双螺旋模型网页 MVP。界面默认法语，可一键切换中文，并用于课堂展示 DNA 的两条链、糖-磷酸骨架、碱基互补配对和双螺旋整体结构。

MVP web interactif bilingue chinois-français pour l'enseignement de la double hélice d'ADN au lycée et en début d'université. L'interface est en français par défaut, avec un bouton pour basculer en chinois. Il permet de montrer les deux brins, le squelette sucre-phosphate, l'appariement complémentaire des bases et la structure globale de la double hélice.

## 如何运行 / Lancer le projet

```bash
npm install
npm run dev
```

构建生产版本 / Construire la version de production:

```bash
npm run build
```

运行基础测试 / Lancer les tests de base:

```bash
npm run test
```

## 静态部署 / Déploiement statique

适合 EdgeOne Pages、Cloudflare Pages、Vercel Static、Netlify 等静态前端托管。

Convient à EdgeOne Pages, Cloudflare Pages, Vercel Static, Netlify et autres hébergements front-end statiques.

- Node 版本 / Version Node: `20.18.0`; `edgeone.json` 指定 EdgeOne 预装版本。
- 安装命令 / Commande d'installation: `npm ci`
- 构建命令 / Commande de build: `npm run build`
- 输出目录 / Dossier de sortie: `dist`
- 项目根目录 / Racine du projet: `/`
- Vercel: `vercel.json` 使用相同安装命令、构建命令和输出目录 / utilise les mêmes commandes d'installation, de build et le même dossier de sortie.

## 自动发布 / Publication automatique

本机已配置仓库级 `post-push` hook。之后推送 `main` 分支时，会自动运行检查并发布到 Vercel 和阿里云 `/dbio/`。

```bash
npm run hooks:install
```

日常更新推荐使用一条命令完成检查、提交、推送和部署：

```bash
npm run deploy:prod -- "更新说明"
```

也可以手动推送；只要当前机器启用了 `.githooks`，推送 `main` 后会自动部署：

```bash
git push origin main
```

可选环境变量：

- `DBIO_AUTO_DEPLOY=0`: 临时跳过 post-push 自动部署。
- `DBIO_SKIP_VERCEL=1`: 跳过 Vercel。
- `DBIO_SKIP_ALIYUN=1`: 跳过阿里云。
- `DBIO_SKIP_CHECKS=1`: 跳过本地测试、lint 和构建检查。

## 主要功能 / Fonctionnalités principales

- 代码生成的 3D DNA 双螺旋模型，无外部图片或 3D 模型文件依赖。 / Modèle 3D de double hélice ADN généré par code, sans image externe ni fichier 3D.
- 两条螺旋状糖-磷酸骨架、内部碱基和教学化氢键点线。 / Deux squelettes sucre-phosphate hélicoïdaux, bases internes et liaisons hydrogène schématiques en pointillés.
- 仅允许 A-T 和 C-G 互补配对，不混入 RNA 的 U。 / Appariements complémentaires A-T et C-G uniquement, sans U d'ARN.
- 鼠标旋转、缩放、拖拽观察模型。 / Rotation, zoom et déplacement du modèle à la souris.
- 默认法语界面，可一键切换中文并记住选择。 / Interface française par défaut, bascule en chinois en un clic avec mémorisation du choix.
- 点击碱基查看名称、配对关系和当前语言解释。 / Clic sur une base pour afficher son nom, son appariement et son explication dans la langue active.
- 控制标签、骨架、氢键、互补配对高亮和双链分离动画。 / Contrôle des étiquettes, du squelette, des liaisons H, du surlignage des paires et de l'animation de séparation des brins.
- Step 1 到 Step 4 分步讲解模式。 / Mode guidé de l'étape 1 à l'étape 4.
- 输入 DNA 序列并自动生成互补链，模型最多展示前 20 个碱基对。 / Saisie d'une séquence ADN et génération automatique du brin complémentaire; affichage limité aux 20 premières paires de bases.
- 拼装模式：学生可拖拽或点击 A/T/C/G 碱基，把互补碱基放入模板链槽位。 / Mode assemblage: les élèves peuvent glisser ou cliquer les bases A/T/C/G pour placer la base complémentaire dans le bon emplacement.
- 拼装反馈：错误配对会提示正确互补碱基；正确配对会显示 A-T 2 条氢键或 C-G 3 条氢键。 / Retour d'assemblage: une erreur indique la bonne base complémentaire; une bonne paire affiche 2 liaisons H pour A-T ou 3 pour C-G.
- 拼装结果会实时生成 3D 双螺旋片段，并可同步为当前观察序列。 / Le résultat d'assemblage génère en temps réel un segment 3D de double hélice et peut devenir la séquence observée.
- 响应式移动端布局：小屏优先显示 3D 模型，按钮和拼装槽位适配触控操作。 / Mise en page responsive: sur petit écran, le modèle 3D reste prioritaire et les boutons/emplacements sont adaptés au tactile.

## 科学简化说明 / Simplifications scientifiques

本项目是教学简化模型，不代表真实原子尺度结构。氢键使用点线示意，只表达碱基配对关系，不表示真实键长、角度或完整分子构象。视觉风格参考教材常见 DNA 双螺旋示意图：宽螺旋带表示糖-磷酸骨架，扁平色块表示碱基。

Ce projet est un modèle pédagogique simplifié, pas une structure réelle à l'échelle atomique. Les liaisons hydrogène sont représentées par des pointillés pour montrer l'appariement des bases, sans représenter les longueurs de liaison, les angles ou la conformation moléculaire complète. Le style visuel suit les schémas de manuels: larges rubans pour le squelette sucre-phosphate et blocs colorés plats pour les bases.

当前 3D 几何按常见 B-DNA 教学参数设置：A-T 显示 2 条氢键，C-G 显示 3 条氢键；约 10 个碱基对一圈，每步约 36°，直径约 1.9 nm。

La géométrie 3D suit des paramètres pédagogiques courants du B-ADN: A-T affiche 2 liaisons hydrogène, C-G en affiche 3; environ 10 paires de bases par tour, 36° par étape, diamètre d'environ 1,9 nm.

## 未来可扩展方向 / Extensions possibles

- DNA 复制：在当前“分离双链”视觉基础上加入新链合成过程。 / Réplication de l'ADN: ajouter la synthèse de nouveaux brins après la séparation visuelle des deux brins.
- 转录：后续可单独引入 RNA 链生成逻辑，避免与 DNA 模型混淆。 / Transcription: introduire séparément la génération d'un brin d'ARN pour éviter la confusion avec le modèle ADN.
- 翻译：可扩展密码子、tRNA 和氨基酸对应关系的课堂互动模块。 / Traduction: étendre avec des codons, des ARNt et des correspondances avec les acides aminés.

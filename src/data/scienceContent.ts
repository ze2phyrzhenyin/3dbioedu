import type { Language, StepId } from '../types'
import type { DnaBase, PairType } from '../utils/dna'
import { englishTranslations } from './englishTranslations'

export type LocalizedText = Record<'fr' | 'zh', string> & { en?: string }

export function localize(content: LocalizedText, language: Language) {
  if (language === 'en') {
    return content.en ?? englishTranslations[content.fr] ?? content.fr
  }
  return content[language]
}

export const DEFAULT_DNA_SEQUENCE = 'ATGCGTACGCTAGCTAGCTA'
export const MAX_DISPLAYED_BASE_PAIRS = 20
export const ASSEMBLY_CHALLENGE_SEQUENCES = [
  'ATGCGTACCGTA',
  'CGTATGCCATGC',
  'TACGGCATATCG',
] as const

export const languageNames: Record<Language, string> = {
  en: 'English',
  fr: 'Français',
  zh: '中文',
}

export const baseContent: Record<
  DnaBase,
  {
    name: LocalizedText
    explanation: LocalizedText
    color: string
  }
> = {
  A: {
    name: {
      fr: 'Adénine',
      zh: '腺嘌呤',
    },
    explanation: {
      fr: "A s'apparie uniquement avec T.",
      zh: 'A 只与 T 形成互补配对。',
    },
    color: '#8bd3e6',
  },
  T: {
    name: {
      fr: 'Thymine',
      zh: '胸腺嘧啶',
    },
    explanation: {
      fr: "T s'apparie uniquement avec A.",
      zh: 'T 只与 A 形成互补配对。',
    },
    color: '#f59e63',
  },
  C: {
    name: {
      fr: 'Cytosine',
      zh: '胞嘧啶',
    },
    explanation: {
      fr: "C s'apparie uniquement avec G.",
      zh: 'C 只与 G 形成互补配对。',
    },
    color: '#a7c957',
  },
  G: {
    name: {
      fr: 'Guanine',
      zh: '鸟嘌呤',
    },
    explanation: {
      fr: "G s'apparie uniquement avec C.",
      zh: 'G 只与 C 形成互补配对。',
    },
    color: '#c89bc5',
  },
}

export const pairContent: Record<
  PairType,
  {
    label: string
    explanation: LocalizedText
    accentColor: string
    hydrogenBondCount: number
  }
> = {
  'A-T': {
    label: 'A-T',
    explanation: {
      fr: "A et T forment une paire de bases complémentaires dans l'ADN.",
      zh: 'A 与 T 是 DNA 中的一组互补碱基对。',
    },
    accentColor: '#d97706',
    hydrogenBondCount: 2,
  },
  'C-G': {
    label: 'C-G',
    explanation: {
      fr: "C et G forment une paire de bases complémentaires dans l'ADN.",
      zh: 'C 与 G 是 DNA 中的一组互补碱基对。',
    },
    accentColor: '#0f766e',
    hydrogenBondCount: 3,
  },
}

export const modelNotes = {
  simplified: {
    fr: "Représentation pédagogique simplifiée, pas une structure à l'échelle atomique.",
    zh: '这是教学简化表示，不代表真实原子尺度结构。',
  },
  hydrogenBond: {
    fr: "Les liaisons hydrogène sont indiquées par des pointillés pédagogiques: elles montrent l'appariement, pas les longueurs ou angles réels.",
    zh: '氢键使用教学化点线表示，只表示配对关系，不表示真实键长或角度。',
  },
  geometryBasis: {
    fr: "Paramètres B-ADN courants: environ 10 paires de bases par tour, 36° par étape, diamètre d'environ 1,9 nm.",
    zh: '模型按常见 B-DNA 教学参数设定：约 10 个碱基对一圈、每步约 36°、直径约 1.9 nm。',
  },
  sequenceLimit: {
    fr: 'Seules les 20 premières paires de bases sont affichées.',
    zh: '当前仅展示前 20 个碱基对。',
  },
  invalidSequence: {
    fr: 'Saisir uniquement A, T, C ou G',
    zh: '只能输入 A、T、C、G',
  },
}

export const assemblyContent = {
  title: {
    fr: 'Assembler le brin complémentaire',
    zh: '拼装互补链',
  },
  intro: {
    fr: 'Faites glisser A, T, C ou G dans les emplacements pour former chaque paire complémentaire correcte.',
    zh: '把 A、T、C、G 拖到右侧空槽，让每一位都形成正确互补配对。',
  },
  initialFeedback: {
    fr: 'Sélectionnez ou faites glisser une base, puis placez-la dans le bon emplacement.',
    zh: '选择或拖拽一个碱基，再放入对应空槽。',
  },
  correctFeedback: {
    fr: 'Appariement correct, cette paire a été ajoutée au modèle.',
    zh: '配对正确，模型已加入这一组碱基对。',
  },
  completeFeedback: {
    fr: 'Assemblage terminé: vous pouvez former un segment complet de double hélice.',
    zh: '全部拼装完成，可以形成完整双螺旋片段。',
  },
  invalidBaseFeedback: {
    fr: 'Utilisez uniquement les bases ADN A, T, C ou G.',
    zh: '只能使用 DNA 碱基 A、T、C、G。',
  },
  emptyBuildFeedback: {
    fr: 'Complétez au moins une paire correcte avant de former la double hélice.',
    zh: '先完成至少 1 组正确配对，再形成双螺旋。',
  },
  buildFeedback: {
    fr: 'Le modèle de double hélice utilise les paires que vous avez assemblées.',
    zh: '已用你拼出的碱基对生成双螺旋模型。',
  },
  pairingRuleTitle: {
    fr: "Règle d'assemblage",
    zh: '拼装规则',
  },
  pairingRule: {
    fr: "Le brin modèle donne une base; placez sa base complémentaire à droite. A s'apparie avec T, C avec G.",
    zh: '左侧模板链给出一个碱基，右侧必须放入它的互补碱基。A 与 T 配对，C 与 G 配对。',
  },
  structureRule: {
    fr: "La zone d'assemblage ressemble d'abord à une échelle: les côtés sont le squelette, les barreaux sont les paires de bases; la zone 3D montre une hélice schématique de manuel.",
    zh: '拼装区先像梯子：两侧是骨架，横档是碱基对；3D 区显示类似教材图的螺旋带示意模型。',
  },
}

export const stepGuideContent: Array<{
  id: StepId
  title: LocalizedText
  description: LocalizedText
}> = [
  {
    id: 1,
    title: {
      fr: 'Deux brins',
      zh: '两条链',
    },
    description: {
      fr: "L'ADN est composé de deux brins; on observe d'abord le squelette sucre-phosphate externe.",
      zh: 'DNA 由两条链组成；这里先只看外侧糖-磷酸骨架。',
    },
  },
  {
    id: 2,
    title: {
      fr: "Bases à l'intérieur",
      zh: '碱基在内侧',
    },
    description: {
      fr: "Les bases A, T, C et G partent du squelette vers l'intérieur de la double hélice.",
      zh: 'A、T、C、G 碱基从骨架伸向双螺旋内部。',
    },
  },
  {
    id: 3,
    title: {
      fr: 'Appariement complémentaire',
      zh: '互补配对',
    },
    description: {
      fr: "A s'apparie avec T, C avec G; les pointillés représentent les liaisons hydrogène.",
      zh: 'A 与 T 配对，C 与 G 配对；点线是氢键示意。',
    },
  },
  {
    id: 4,
    title: {
      fr: 'Double hélice complète',
      zh: '完整双螺旋',
    },
    description: {
      fr: "Le squelette reste à l'extérieur, les paires de bases à l'intérieur, et l'ensemble forme une double hélice.",
      zh: '外侧是骨架，内侧是碱基对，整体形成双螺旋。',
    },
  },
]

export const futureExtensionNotes = [
  {
    fr: "Réplication de l'ADN: ajouter la synthèse de nouveaux brins après séparation.",
    zh: 'DNA 复制：可在分离双链基础上加入新链合成过程。',
  },
  {
    fr: "Transcription: ajouter la génération d'ARN dans une étape séparée, sans mélanger U au modèle ADN.",
    zh: '转录：可加入 RNA 链生成，但本 MVP 不混入 U。',
  },
  {
    fr: 'Traduction: ajouter plus tard les codons, les ARNt et les acides aminés.',
    zh: '翻译：可在后续版本加入密码子与氨基酸对应关系。',
  },
]

export const uiText = {
  app: {
    eyebrow: {
      fr: 'Modèle pédagogique simplifié',
      zh: '教学简化模型',
    },
    title: {
      fr: "Explorateur de la double hélice d'ADN",
      zh: 'DNA 双螺旋探索器',
    },
    summary: {
      fr: 'Observez les deux brins, le squelette sucre-phosphate, les appariements A-T / C-G et la structure globale de la double hélice.',
      zh: '观察两条链、糖-磷酸骨架、A-T / C-G 互补配对和双螺旋整体结构。',
    },
    modeLabel: {
      fr: "Mode d'apprentissage",
      zh: '学习模式',
    },
    exploreMode: {
      fr: 'Explorer',
      zh: '观察模型',
    },
    assembleMode: {
      fr: 'Assembler',
      zh: '拼装模式',
    },
    metabolismMode: {
      fr: 'Photosynthèse',
      zh: '光合与呼吸',
    },
    ecosystemMode: {
      fr: 'Écosystème',
      zh: '生态系统',
    },
    geographyMode: {
      fr: 'Géographie',
      zh: '地理环流',
    },
    windMode: {
      fr: 'Vents',
      zh: '风向判读',
    },
    metabolismTitle: {
      fr: 'Photosynthèse et respiration',
      zh: '光合作用与呼吸作用模型',
    },
    metabolismSummary: {
      fr: 'Comparez photosynthèse et respiration, ajustez les facteurs du milieu et observez le bilan net en dioxygène, dioxyde de carbone et matière organique.',
      zh: '调节光照、二氧化碳、水分、温度和叶片面积，比较光合作用与呼吸作用对氧气、二氧化碳和有机物的净影响。',
    },
    ecosystemTitle: {
      fr: "Modèle dynamique d'écosystème",
      zh: '生态系统动态模型',
    },
    ecosystemSummary: {
      fr: "Modifiez un réseau alimentaire, augmentez les prédateurs ou la pollution, puis observez les flux d'énergie, les populations et la stabilité du système.",
      zh: '调整食物网、增加捕食者或污染强度，观察能量流动、种群数量和系统稳定性的变化。',
    },
    geographyTitle: {
      fr: 'Circulation atmosphérique et océanique',
      zh: '大气环流与洋流模型',
    },
    geographySummary: {
      fr: 'Reliez le rayonnement solaire, les ceintures de pression, les vents planétaires, la force de Coriolis, les courants océaniques et les climats.',
      zh: '联动太阳辐射、气压带、风带、地转偏向力、洋流和气候成因，训练高中地理环流逻辑。',
    },
    windTitle: {
      fr: 'Lecture des vents et isobares',
      zh: '等压线风向判读模型',
    },
    windSummary: {
      fr: "Jugez le vent réel à partir des hautes et basses pressions, de l'hémisphère, du frottement et de l'altitude.",
      zh: '从高低压、半球、摩擦力和高度出发，动态判读近地面风与高空风的实际方向。',
    },
    assemblyWorkspaceLabel: {
      fr: "Espace d'assemblage ADN",
      zh: 'DNA 拼装工作区',
    },
    metabolismWorkspaceLabel: {
      fr: 'Espace photosynthèse et respiration',
      zh: '光合作用与呼吸作用工作区',
    },
    ecosystemWorkspaceLabel: {
      fr: "Espace modèle d'écosystème",
      zh: '生态系统模型工作区',
    },
    geographyWorkspaceLabel: {
      fr: 'Espace modèle de géographie physique',
      zh: '自然地理环流模型工作区',
    },
    windWorkspaceLabel: {
      fr: 'Espace lecture des vents',
      zh: '风向判读模型工作区',
    },
    stageLabel: {
      fr: 'Zone modèle ADN et séquence',
      zh: 'DNA 模型与序列区域',
    },
    assemblyEmptyMessage: {
      fr: "Le segment 3D apparaît après l'appariement correct",
      zh: '完成正确配对后生成双螺旋片段',
    },
  },
  language: {
    switchLabel: {
      fr: '中文',
      zh: 'Français',
    },
    ariaLabel: {
      fr: 'Passer en chinois',
      zh: '切换到法语',
    },
  },
  controls: {
    eyebrow: {
      fr: 'Contrôles',
      zh: '控制',
    },
    title: {
      fr: 'Affichage du modèle',
      zh: '模型显示',
    },
    resetView: {
      fr: 'Réinitialiser la vue',
      zh: '重置视角',
    },
    showLabels: {
      fr: 'Afficher les étiquettes',
      zh: '显示标签',
    },
    highlightPairs: {
      fr: 'Surligner les paires',
      zh: '高亮互补配对',
    },
    showBackbone: {
      fr: 'Afficher le squelette',
      zh: '显示骨架',
    },
    showHydrogenBonds: {
      fr: 'Afficher les liaisons H',
      zh: '显示氢键',
    },
    splitOpen: {
      fr: 'Séparer les brins',
      zh: '分离双链',
    },
  },
  info: {
    eyebrow: {
      fr: 'Informations',
      zh: '信息',
    },
    title: {
      fr: 'Description des bases',
      zh: '碱基说明',
    },
    emptyState: {
      fr: 'Cliquez sur une base du modèle pour voir son appariement.',
      zh: '点击模型中的碱基查看配对关系。',
    },
    currentBase: {
      fr: 'Base sélectionnée',
      zh: '当前碱基',
    },
    pairing: {
      fr: 'Appariement',
      zh: '配对关系',
    },
    basePair: {
      fr: 'Paire de bases',
      zh: '碱基对',
    },
    hydrogenBondCount: {
      fr: 'Liaisons H schématiques',
      zh: '氢键示意数',
    },
    classroomExplanation: {
      fr: 'Explication',
      zh: '课堂解释',
    },
    pairingPrinciple: {
      fr: "Principe d'appariement",
      zh: '配对原则',
    },
  },
  sequence: {
    eyebrow: {
      fr: 'Interaction élève',
      zh: '学生互动',
    },
    title: {
      fr: 'Générer le brin complémentaire',
      zh: '互补链生成',
    },
    inputLabel: {
      fr: 'Saisir une séquence ADN',
      zh: '输入 DNA 序列',
    },
    complement: {
      fr: 'Brin complémentaire',
      zh: '互补链',
    },
    displayed: {
      fr: 'Séquence affichée',
      zh: '模型展示',
    },
    emptySequence: {
      fr: 'Séquence vide',
      zh: '空序列',
    },
    previousValid: {
      fr: 'Le modèle conserve la dernière séquence valide:',
      zh: '模型保留上一条有效序列：',
    },
  },
  stepGuide: {
    eyebrow: {
      fr: 'Mode guidé',
      zh: '讲解模式',
    },
    title: {
      fr: 'Observation par étapes',
      zh: '分步观察',
    },
    stepPrefix: {
      fr: 'Étape',
      zh: '步骤',
    },
  },
  assembly: {
    eyebrow: {
      fr: 'Mode assemblage',
      zh: '拼装模式',
    },
    progressLabel: {
      fr: "Progression de l'assemblage",
      zh: '拼装进度',
    },
    paletteLabel: {
      fr: 'Bases à déplacer',
      zh: '可拖拽碱基',
    },
    boardLabel: {
      fr: "Emplacements d'assemblage ADN",
      zh: 'DNA 拼装槽位',
    },
    slotEmpty: {
      fr: 'Poser',
      zh: '放入',
    },
    waitingFor: {
      fr: 'Attente',
      zh: '等待',
    },
    hydrogenBonds: {
      fr: 'liaisons H',
      zh: '条氢键',
    },
    hydrogenBondLines: {
      fr: 'liaisons H schématiques',
      zh: '条氢键示意线',
    },
    buildHelix: {
      fr: "Former l'hélice",
      zh: '形成双螺旋',
    },
    nextHint: {
      fr: 'Indice suivant',
      zh: '提示下一位',
    },
    reset: {
      fr: 'Réinitialiser',
      zh: '重置拼装',
    },
    switchChallenge: {
      fr: 'Nouvelle séquence',
      zh: '换一组序列',
    },
    helpEyebrow: {
      fr: 'Points clés',
      zh: '课堂要点',
    },
  },
  scene: {
    diagramLabel: {
      fr: 'Schéma pédagogique de la double hélice ADN',
      zh: 'DNA 双螺旋教学示意图',
    },
    modelLabel: {
      fr: 'Modèle 3D de la double hélice ADN',
      zh: 'DNA 双螺旋 3D 模型',
    },
    fallback2dLabel: {
      fr: 'Schéma pédagogique ADN en 2D',
      zh: 'DNA 二维教学示意图',
    },
    fallback2dImageLabel: {
      fr: 'Schéma 2D de secours de la double hélice ADN',
      zh: 'DNA 双螺旋二维备用示意图',
    },
    fallback2dNote: {
      fr: "WebGL n'est pas activé dans cet environnement; affichage du schéma pédagogique 2D.",
      zh: '当前环境未启用 WebGL，显示二维教学示意图。',
    },
    emptySequence: {
      fr: 'Saisir une séquence A/T/C/G',
      zh: '请输入 A/T/C/G 序列',
    },
  },
}

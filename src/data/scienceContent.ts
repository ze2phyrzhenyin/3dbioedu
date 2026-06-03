import type { DnaBase, PairType } from '../utils/dna'

export const DEFAULT_DNA_SEQUENCE = 'ATGCGTACGCTAGCTAGCTA'
export const MAX_DISPLAYED_BASE_PAIRS = 20
export const ASSEMBLY_CHALLENGE_SEQUENCES = [
  'ATGCGTACCGTA',
  'CGTATGCCATGC',
  'TACGGCATATCG',
] as const

export const baseContent: Record<
  DnaBase,
  {
    name: string
    explanation: string
    color: string
  }
> = {
  A: {
    name: '腺嘌呤 / Adénine',
    explanation: "A 只与 T 形成互补配对。 / A s'apparie uniquement avec T.",
    color: '#8bd3e6',
  },
  T: {
    name: '胸腺嘧啶 / Thymine',
    explanation: "T 只与 A 形成互补配对。 / T s'apparie uniquement avec A.",
    color: '#f59e63',
  },
  C: {
    name: '胞嘧啶 / Cytosine',
    explanation: "C 只与 G 形成互补配对。 / C s'apparie uniquement avec G.",
    color: '#a7c957',
  },
  G: {
    name: '鸟嘌呤 / Guanine',
    explanation: "G 只与 C 形成互补配对。 / G s'apparie uniquement avec C.",
    color: '#c89bc5',
  },
}

export const pairContent: Record<
  PairType,
  {
    label: string
    explanation: string
    accentColor: string
    hydrogenBondCount: number
  }
> = {
  'A-T': {
    label: 'A-T',
    explanation:
      "A 与 T 是 DNA 中的一组互补碱基对。 / A et T forment une paire de bases complémentaires dans l'ADN.",
    accentColor: '#d97706',
    hydrogenBondCount: 2,
  },
  'C-G': {
    label: 'C-G',
    explanation:
      "C 与 G 是 DNA 中的一组互补碱基对。 / C et G forment une paire de bases complémentaires dans l'ADN.",
    accentColor: '#0f766e',
    hydrogenBondCount: 3,
  },
}

export const modelNotes = {
  simplified:
    "这是教学简化表示，不代表真实原子尺度结构。 / Représentation pédagogique simplifiée, pas une structure à l'échelle atomique.",
  hydrogenBond:
    "氢键使用教学化点线表示，只表示配对关系，不表示真实键长或角度。 / Les liaisons hydrogène sont indiquées par des pointillés pédagogiques: elles montrent l'appariement, pas les longueurs ou angles réels.",
  geometryBasis:
    "模型按常见 B-DNA 教学参数设定：约 10 个碱基对一圈、每步约 36°、直径约 1.9 nm。 / Paramètres B-ADN courants: environ 10 paires de bases par tour, 36° par étape, diamètre d'environ 1,9 nm.",
  sequenceLimit:
    '当前仅展示前 20 个碱基对。 / Seules les 20 premières paires de bases sont affichées.',
  invalidSequence: '只能输入 A、T、C、G / Saisir uniquement A, T, C ou G',
}

export const assemblyContent = {
  title: '拼装互补链 / Assembler le brin complémentaire',
  intro:
    '把 A、T、C、G 拖到右侧空槽，让每一位都形成正确互补配对。 / Faites glisser A, T, C ou G dans les emplacements pour former chaque paire complémentaire correcte.',
  initialFeedback:
    '选择或拖拽一个碱基，再放入对应空槽。 / Sélectionnez ou faites glisser une base, puis placez-la dans le bon emplacement.',
  correctFeedback:
    '配对正确，模型已加入这一组碱基对。 / Appariement correct, cette paire a été ajoutée au modèle.',
  completeFeedback:
    '全部拼装完成，可以形成完整双螺旋片段。 / Assemblage terminé: vous pouvez former un segment complet de double hélice.',
  invalidBaseFeedback:
    '只能使用 DNA 碱基 A、T、C、G。 / Utilisez uniquement les bases ADN A, T, C ou G.',
  emptyBuildFeedback:
    '先完成至少 1 组正确配对，再形成双螺旋。 / Complétez au moins une paire correcte avant de former la double hélice.',
  buildFeedback:
    '已用你拼出的碱基对生成双螺旋模型。 / Le modèle de double hélice utilise les paires que vous avez assemblées.',
  pairingRuleTitle: "拼装规则 / Règle d'assemblage",
  pairingRule:
    "左侧模板链给出一个碱基，右侧必须放入它的互补碱基。A 与 T 配对，C 与 G 配对。 / Le brin modèle donne une base; placez sa base complémentaire à droite. A s'apparie avec T, C avec G.",
  structureRule:
    '拼装区先像梯子：两侧是骨架，横档是碱基对；3D 区显示类似教材图的螺旋带示意模型。 / La zone d\'assemblage ressemble d\'abord à une échelle: les côtés sont le squelette, les barreaux sont les paires de bases; la zone 3D montre une hélice schématique de manuel.',
}

export const stepGuideContent = [
  {
    id: 1,
    title: '两条链 / Deux brins',
    description:
      "DNA 由两条链组成；这里先只看外侧糖-磷酸骨架。 / L'ADN est composé de deux brins; on observe d'abord le squelette sucre-phosphate externe.",
  },
  {
    id: 2,
    title: "碱基在内侧 / Bases à l'intérieur",
    description:
      "A、T、C、G 碱基从骨架伸向双螺旋内部。 / Les bases A, T, C et G partent du squelette vers l'intérieur de la double hélice.",
  },
  {
    id: 3,
    title: '互补配对 / Appariement complémentaire',
    description:
      "A 与 T 配对，C 与 G 配对；点线是氢键示意。 / A s'apparie avec T, C avec G; les pointillés représentent les liaisons hydrogène.",
  },
  {
    id: 4,
    title: '完整双螺旋 / Double hélice complète',
    description:
      "外侧是骨架，内侧是碱基对，整体形成双螺旋。 / Le squelette reste à l'extérieur, les paires de bases à l'intérieur, et l'ensemble forme une double hélice.",
  },
] as const

export const futureExtensionNotes = [
  "DNA 复制：可在分离双链基础上加入新链合成过程。 / Réplication de l'ADN: ajouter la synthèse de nouveaux brins après séparation.",
  '转录：可加入 RNA 链生成，但本 MVP 不混入 U。 / Transcription: ajouter la génération d\'ARN dans une étape séparée, sans mélanger U au modèle ADN.',
  '翻译：可在后续版本加入密码子与氨基酸对应关系。 / Traduction: ajouter plus tard les codons, les ARNt et les acides aminés.',
]

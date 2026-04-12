import type { ProfessionalFocus } from './professionalFocus'

const psychologicalPracticePresets = [
  'Гештальт-терапія',
  'Когнітивно-поведінкова терапія',
  'Клієнт-центрована терапія',
  'Екзистенційна терапія',
  'Психоаналіз',
  'Схема-терапія',
  'Позитивна психотерапія',
  'Арттерапія',
  'Психодрама',
  'Транзакційний аналіз',
  'Терапія прийняття і відповідальності (ACT)',
  'Інше',
] as const

const coachingPracticePresets = [
  'Кар’єрний коучинг',
  'Life coaching',
  'Executive coaching',
  'Leadership coaching',
  'Бізнес-коучинг',
  'Командний коучинг',
  'Коучинг змін',
  'Коучинг цілей',
  'Коучинг самореалізації',
  'Інше',
] as const

const mentoringPracticePresets = [
  'Кар’єрне менторство',
  'Професійний розвиток',
  'Менторство для початківців',
  'Запуск приватної практики',
  'Розвиток експертності',
  'Підготовка до нової ролі',
  'Навчальний супровід',
  'Індивідуальний супровід розвитку',
  'Інше',
] as const

const consultingPracticePresets = [
  'Індивідуальні консультації',
  'Бізнес-консалтинг',
  'Консультації для команд',
  'Організаційний розвиток',
  'Стратегічні сесії',
  'Консультації з комунікації',
  'Консультації з управління',
  'Консультації зі змін',
  'Інше',
] as const

const teachingPracticePresets = [
  'Індивідуальне навчання',
  'Авторські програми',
  'Підготовка до іспитів',
  'Навчальний супровід',
  'Викладання для груп',
  'Практичні заняття',
  'Освітні консультації',
  'Методичний супровід',
  'Інше',
] as const

const otherPracticePresets = [
  'Індивідуальна практика',
  'Супровід розвитку',
  'Консультаційна робота',
  'Робота з групами',
  'Авторські формати',
  'Інше',
] as const

const fallbackPresets = [
  'Індивідуальна практика',
  'Робота з групами',
  'Консультаційний супровід',
  'Освітній супровід',
  'Розвиток навичок',
  'Авторські формати',
  'Інше',
] as const

const specializationPresetsByFocus: Record<ProfessionalFocus, readonly string[]> = {
  psychological_practice: psychologicalPracticePresets,
  coaching_practice: coachingPracticePresets,
  mentoring_practice: mentoringPracticePresets,
  consulting_practice: consultingPracticePresets,
  teaching_practice: teachingPracticePresets,
  other: otherPracticePresets,
}

export function getSpecializationPresets(focus: ProfessionalFocus | null | undefined): readonly string[] {
  if (!focus) return fallbackPresets
  return specializationPresetsByFocus[focus] || fallbackPresets
}

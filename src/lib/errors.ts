export function getApiErrorMessage(err: unknown, fallback: string) {
  const isHtmlErrorPayload = (value: string): boolean => {
    const trimmed = value.trim().toLowerCase()
    return (
      trimmed.startsWith('<!doctype') ||
      trimmed.startsWith('<html') ||
      trimmed.startsWith('<body') ||
      trimmed.includes('<html')
    )
  }

  const detailLabel = (detail: string): string => {
    const mapped: Record<string, string> = {
      'Authentication required.': 'РџРѕС‚СЂС–Р±РЅР° Р°РІС‚РѕСЂРёР·Р°С†С–СЏ.',
      'Session not found.': 'РЎРµСЃС–СЋ РЅРµ Р·РЅР°Р№РґРµРЅРѕ.',
      'Session context required.': 'РљРѕРЅС‚РµРєСЃС‚ СЃРµСЃС–С— РІС–РґСЃСѓС‚РЅС–Р№.',
      'Slot not found.': 'Р’С–Р»СЊРЅРµ РІС–РєРЅРѕ РЅРµ Р·РЅР°Р№РґРµРЅРѕ.',
      'Slot already booked.': 'Р¦Рµ РІС–Р»СЊРЅРµ РІС–РєРЅРѕ РІР¶Рµ Р·Р°Р№РЅСЏС‚Рµ.',
      'Slot already booked and cannot be changed.':
        'Р¦Рµ РІС–Р»СЊРЅРµ РІС–РєРЅРѕ РІР¶Рµ Р·Р°Р±СЂРѕРЅСЊРѕРІР°РЅРµ С– РЅРµ РјРѕР¶Рµ Р±СѓС‚Рё Р·РјС–РЅРµРЅРµ.',
      'Slot is in the past.': 'РќРµРјРѕР¶Р»РёРІРѕ РѕР±СЂР°С‚Рё РІС–РєРЅРѕ РІ РјРёРЅСѓР»РѕРјСѓ.',
      'Slot belongs to a different specialist.': 'Р’С–Р»СЊРЅРµ РІС–РєРЅРѕ РЅР°Р»РµР¶РёС‚СЊ С–РЅС€РѕРјСѓ СЃРїРµС†С–Р°Р»С–СЃС‚Сѓ.',
      'Invalid status transition.': 'Р¦СЋ РґС–СЋ РЅРµРјРѕР¶Р»РёРІРѕ РІРёРєРѕРЅР°С‚Рё РґР»СЏ РїРѕС‚РѕС‡РЅРѕРіРѕ СЃС‚Р°С‚СѓСЃСѓ СЃРµСЃС–С—.',
      'Cannot cancel after start time.': 'РќРµРјРѕР¶Р»РёРІРѕ СЃРєР°СЃСѓРІР°С‚Рё СЃРµСЃС–СЋ РїС–СЃР»СЏ С—С— РїРѕС‡Р°С‚РєСѓ.',
      'Cannot reschedule after start time.': 'РќРµРјРѕР¶Р»РёРІРѕ РїРµСЂРµРЅРµСЃС‚Рё СЃРµСЃС–СЋ РїС–СЃР»СЏ С—С— РїРѕС‡Р°С‚РєСѓ.',
      'Cannot reschedule within 12 hours of start time.':
        'РќРµРјРѕР¶Р»РёРІРѕ РїРµСЂРµРЅРµСЃС‚Рё СЃРµСЃС–СЋ РјРµРЅС€ РЅС–Р¶ Р·Р° 12 РіРѕРґРёРЅ РґРѕ РїРѕС‡Р°С‚РєСѓ.',
      'Cannot reschedule to an earlier slot.': 'РќРµРјРѕР¶Р»РёРІРѕ РїРµСЂРµРЅРµСЃС‚Рё СЃРµСЃС–СЋ РЅР° СЂР°РЅС–С€РёР№ С‡Р°СЃ.',
      'Session overlaps with another booking.': 'РћР±СЂР°РЅРёР№ С‡Р°СЃ РїРµСЂРµС‚РёРЅР°С”С‚СЊСЃСЏ Р· С–РЅС€РѕСЋ СЃРµСЃС–С”СЋ.',
      'Reschedule request already pending.': 'Р—Р°РїРёС‚ РЅР° РїРµСЂРµРЅРµСЃРµРЅРЅСЏ РІР¶Рµ РѕС‡С–РєСѓС” РїС–РґС‚РІРµСЂРґР¶РµРЅРЅСЏ.',
      'Request not found.': 'Р—Р°РїРёС‚ РЅРµ Р·РЅР°Р№РґРµРЅРѕ.',
      'Request is not pending.': 'Р¦РµР№ Р·Р°РїРёС‚ РІР¶Рµ РѕР±СЂРѕР±Р»РµРЅРѕ.',
      'Note not found.': 'РќРѕС‚Р°С‚РєСѓ РЅРµ Р·РЅР°Р№РґРµРЅРѕ.',
      'Review not found.': 'Р’С–РґРіСѓРє РЅРµ Р·РЅР°Р№РґРµРЅРѕ.',
      'Invalid status.': 'РќРµРєРѕСЂРµРєС‚РЅРёР№ СЃС‚Р°С‚СѓСЃ.',
      'No fields to update.': 'РќРµРјР°С” РїРѕР»С–РІ РґР»СЏ РѕРЅРѕРІР»РµРЅРЅСЏ.',
      'Invalid session status.': 'Р”Р»СЏ С†СЊРѕРіРѕ СЃС‚Р°С‚СѓСЃСѓ СЃРµСЃС–С— РґС–СЏ РЅРµРґРѕСЃС‚СѓРїРЅР°.',
      'Reschedule requests are allowed only for confirmed sessions.':
        'Р—Р°РїРёС‚ РЅР° РїРµСЂРµРЅРµСЃРµРЅРЅСЏ РґРѕСЃС‚СѓРїРЅРёР№ Р»РёС€Рµ РґР»СЏ РїС–РґС‚РІРµСЂРґР¶РµРЅРёС… СЃРµСЃС–Р№.',
      'Use specialist_id or therapist_id, not both.':
        'РџРµСЂРµРґР°Р№С‚Рµ Р°Р±Рѕ specialist_id, Р°Р±Рѕ therapist_id.',
      'Not allowed.': 'РќРµРґРѕСЃС‚Р°С‚РЅСЊРѕ РїСЂР°РІ РґР»СЏ С†С–С”С— РґС–С—.',
      'Only clients can book sessions.': 'Р‘СЂРѕРЅСЋРІР°РЅРЅСЏ РґРѕСЃС‚СѓРїРЅРµ Р»РёС€Рµ РєР»С–С”РЅС‚Р°Рј.',
      'Clients only.': 'Р¦СЏ РґС–СЏ РґРѕСЃС‚СѓРїРЅР° Р»РёС€Рµ РєР»С–С”РЅС‚Сѓ.',
      'Invalid status filter.': 'РќРµРєРѕСЂРµРєС‚РЅРёР№ С„С–Р»СЊС‚СЂ СЃС‚Р°С‚СѓСЃСѓ.',
      'Invalid date_from format. Use YYYY-MM-DD.':
        'РќРµРєРѕСЂРµРєС‚РЅРёР№ С„РѕСЂРјР°С‚ date_from. Р’РёРєРѕСЂРёСЃС‚Р°Р№С‚Рµ YYYY-MM-DD.',
      'Invalid date_to format. Use YYYY-MM-DD.':
        'РќРµРєРѕСЂРµРєС‚РЅРёР№ С„РѕСЂРјР°С‚ date_to. Р’РёРєРѕСЂРёСЃС‚Р°Р№С‚Рµ YYYY-MM-DD.',
      'actual_duration_minutes must be an integer.':
        'РўСЂРёРІР°Р»С–СЃС‚СЊ РјР°С” Р±СѓС‚Рё С†С–Р»РёРј С‡РёСЃР»РѕРј С…РІРёР»РёРЅ.',
      'actual_duration_minutes must be between 1 and 480.':
        'РўСЂРёРІР°Р»С–СЃС‚СЊ РјР°С” Р±СѓС‚Рё РІ РґС–Р°РїР°Р·РѕРЅС– 1вЂ“480 С…РІРёР»РёРЅ.',
      'Reviews allowed only for completed sessions.':
        'Р’С–РґРіСѓРє РјРѕР¶РЅР° Р·Р°Р»РёС€РёС‚Рё Р»РёС€Рµ РїС–СЃР»СЏ Р·Р°РІРµСЂС€РµРЅРѕС— СЃРµСЃС–С—.',
      'Review already exists.': 'Р’С–РґРіСѓРє РґР»СЏ С†С–С”С— СЃРµСЃС–С— РІР¶Рµ С–СЃРЅСѓС”.',
      'Review text is required.': 'РўРµРєСЃС‚ РІС–РґРіСѓРєСѓ С” РѕР±РѕРІКјСЏР·РєРѕРІРёРј.',
      'You already left a review for this specialist.':
        'Р’Рё РІР¶Рµ Р·Р°Р»РёС€РёР»Рё РІС–РґРіСѓРє РґР»СЏ С†СЊРѕРіРѕ СЃРїРµС†С–Р°Р»С–СЃС‚Р°.',
    }
    return mapped[detail] || detail
  }

  const fieldLabel = (field: string): string => {
    if (field === 'non_field_errors') return ''
    if (field === 'slot_id') return 'Р’С–Р»СЊРЅРµ РІС–РєРЅРѕ'
    if (field === 'start_time') return 'Р§Р°СЃ РїРѕС‡Р°С‚РєСѓ'
    if (field === 'end_time') return 'Р§Р°СЃ Р·Р°РІРµСЂС€РµРЅРЅСЏ'
    if (field === 'date_from') return 'Р”Р°С‚Р° РїРѕС‡Р°С‚РєСѓ'
    if (field === 'date_to') return 'Р”Р°С‚Р° Р·Р°РІРµСЂС€РµРЅРЅСЏ'
    if (field === 'starts_at') return 'РџРѕС‡Р°С‚РѕРє'
    if (field === 'ends_at') return 'Р—Р°РІРµСЂС€РµРЅРЅСЏ'
    return field
  }

  if (err && typeof err === 'object') {
    const status = (err as { response?: { status?: number } }).response?.status
    const data = (err as { response?: { data?: unknown } }).response?.data

    if (status === 401) {
      return 'РЎРµСЃС–СЏ Р·Р°РІРµСЂС€РёР»Р°СЃСЊ. РЈРІС–Р№РґС–С‚СЊ Р·РЅРѕРІСѓ.'
    }

    if (data && typeof data === 'object' && 'detail' in data) {
      const detail = (data as { detail?: string }).detail
      if (detail) return detailLabel(detail)
    }

    if (typeof data === 'string' && data.trim()) {
      const text = data.trim()
      if (isHtmlErrorPayload(text)) {
        return 'РџРѕРјРёР»РєР° СЃРµСЂРІРµСЂР°. РЎРїСЂРѕР±СѓР№С‚Рµ РїС–Р·РЅС–С€Рµ.'
      }
      return text
    }

    if (data && typeof data === 'object') {
      const [field, messages] = Object.entries(data as Record<string, unknown>)[0] || []
      const label = field ? fieldLabel(field) : ''
      if (field && Array.isArray(messages) && messages[0]) {
        const text = detailLabel(String(messages[0]))
        return label ? `${label}: ${text}` : text
      }
      if (field && typeof messages === 'string') {
        const text = detailLabel(messages)
        return label ? `${label}: ${text}` : text
      }
    }

    const message = (err as { message?: string }).message
    if (message) return message
  }
  return fallback
}


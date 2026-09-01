import type {
  PublicSpecialistDiscoveryParams,
  PublicSpecialistDiscoveryResponse,
} from './api'
import { http } from './http'

export type RotatedPublicSpecialistDiscoveryParams = PublicSpecialistDiscoveryParams & {
  shuffle_seed: string
}

const SPECIALIST_DISCOVERY_PAGE_SIZE = 50

export async function fetchRotatedPublicSpecialistDiscovery(
  params: RotatedPublicSpecialistDiscoveryParams,
): Promise<PublicSpecialistDiscoveryResponse> {
  const response = await http.get<PublicSpecialistDiscoveryResponse>(
    '/public/specialists/discovery/',
    { params: { ...params, page_size: SPECIALIST_DISCOVERY_PAGE_SIZE } },
  )
  return response.data
}

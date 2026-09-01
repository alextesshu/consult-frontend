import type {
  PublicSpecialistDiscoveryParams,
  PublicSpecialistDiscoveryResponse,
} from './api'
import { http } from './http'

export type RotatedPublicSpecialistDiscoveryParams = PublicSpecialistDiscoveryParams & {
  shuffle_seed: string
}

export async function fetchRotatedPublicSpecialistDiscovery(
  params: RotatedPublicSpecialistDiscoveryParams,
): Promise<PublicSpecialistDiscoveryResponse> {
  const response = await http.get<PublicSpecialistDiscoveryResponse>(
    '/public/specialists/discovery/',
    { params },
  )
  return response.data
}

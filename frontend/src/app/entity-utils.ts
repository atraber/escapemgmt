import {environment} from '../environment';

import {Room} from './room';

export class EntityUtils {
  static getRoomProfileImage(room: Room): string {
    return environment.apiEndpoint + '/file/' + room.profile_image;
  }

  static getRoomBgImage(room: Room): string {
    return environment.apiEndpoint + '/file/' + room.bg_image;
  }
}

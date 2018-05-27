import { Score } from './score';

export class Room {
  id: number;
  name: string;
  description: string;
  profile_image: string;
  bg_image: string;
  scores: Score[];

  constructor () {
    this.name = "";
    this.description = "";
    this.profile_image = "";
    this.bg_image = "";
    this.scores = [];
  }
}

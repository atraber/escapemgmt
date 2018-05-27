import { Score } from './score';

export class Room {
  id: number;
  name: string;
  description: string;
  scores: Score[];

  constructor () {
    this.name = "";
    this.description = "";
    this.scores = [];
  }
}

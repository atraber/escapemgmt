export class Score {
  id: number;
  name: string;
  time: number;
  created_at: number;

  constructor () {
    this.name = "";
    this.time = 0;
    this.created_at = 0;
  }
}

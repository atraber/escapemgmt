export class Score {
  id: number;
  name: string;
  time: Number;
  created_at: Number;

  constructor () {
    this.name = "";
    this.time = 0;
    this.created_at = 0;
  }
}

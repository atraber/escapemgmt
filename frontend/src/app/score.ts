/**
 * Copyright 2018 Andreas Traber
 * Licensed under MIT (https://github.com/atraber/escapemgmt/LICENSE)
 */
export class Score {
  id: number;
  name: string;
  time: number;
  created_at: number;
  // rank gets annotated in the highscore component.
  rank: number;

  constructor () {
    this.name = "";
    this.time = 0;
    this.created_at = 0;
  }
}

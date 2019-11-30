/**
 * Copyright 2019 Andreas Traber
 * Licensed under MIT (https://github.com/atraber/escapemgmt/LICENSE)
 */
import {AfterViewInit, Component, QueryList, ContentChildren} from '@angular/core';
import {timer} from 'rxjs';

import {SlideComponent} from './slide.component';

@Component({
  templateUrl: './slidecontainer.component.html',
  styleUrls: ['./slidecontainer.component.scss'],
  selector: 'slide-container',
})
export class SlideContainerComponent implements AfterViewInit {
  @ContentChildren(SlideComponent) slides: QueryList<SlideComponent>;
  interval: number = 5; // Seconds.

  ngAfterViewInit() {
    if (this.slides.length > 0) {
      this.slides.first.showSlide(true);
    }

    let t = timer(this.interval * 1000, this.interval * 1000);
    t.subscribe(t => {
      this.nextSlide();
    });
  }

  private nextSlide() {
    if (this.slides.length > 1) {
      let activeSlide: SlideComponent = null;
      let activate = 0;
      let arr = this.slides.toArray();
      arr.forEach((slide, idx) => {
        if (slide.isShown()) {
          activeSlide = slide;
          activate = idx + 1;
        }
      });

      if (activeSlide != null) {
        activeSlide.showSlide(false);
      }

      activate = activate % this.slides.length;
      arr[activate].showSlide(true);
    } else if (this.slides.length == 1) {
      if (!this.slides.first.isShown()) {
        this.slides.first.showSlide(true);
      }
    }
  }
}

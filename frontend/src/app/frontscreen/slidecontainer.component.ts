/**
 * Copyright 2019 Andreas Traber
 * Licensed under MIT (https://github.com/atraber/escapemgmt/LICENSE)
 */
import {
  AfterContentInit,
  Component,
  ContentChildren,
  QueryList
} from '@angular/core';
import {timer} from 'rxjs';

import {SlideComponent} from './slide.component';

@Component({
  templateUrl : './slidecontainer.component.html',
  styleUrls : [ './slidecontainer.component.scss' ],
  selector : 'slide-container',
})
export class SlideContainerComponent implements AfterContentInit {
  @ContentChildren(SlideComponent, {descendants : true})
  slides: QueryList<SlideComponent>;
  interval: number = 15; // Seconds.

  ngAfterContentInit() {
    if (this.slides.length > 0) {
      this.slides.first.showSlide(true);
    }

    let t = timer(this.interval * 1000, this.interval * 1000);
    t.subscribe(t => { this.nextSlide(); });
  }

  private nextSlide() {
    if (this.slides.length > 1) {
      let activeSlide: SlideComponent = null;
      let activate = 0;
      let slideArray = this.slides.toArray();
      slideArray.forEach((slide, idx) => {
        if (slide.isShown()) {
          activeSlide = slide;
          activate = idx + 1;
        }
      });

      if (activeSlide != null) {
        activeSlide.showSlide(false);
      }

      activate = activate % slideArray.length;
      slideArray[activate].showSlide(true);

      console.log('Next slide is ' + activate);
    } else if (this.slides.length == 1) {
      if (!this.slides.first.isShown()) {
        this.slides.first.showSlide(true);
      }
    }
  }
}

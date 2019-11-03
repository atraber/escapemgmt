/**
 * Copyright 2019 Andreas Traber
 * Licensed under MIT (https://github.com/atraber/escapemgmt/LICENSE)
 */
import {Component} from '@angular/core';
import {
  AnimationEvent,
  trigger,
  state,
  style,
  animate,
  transition
} from '@angular/animations';

@Component({
  templateUrl: './slide.component.html',
  styleUrls: ['./slide.component.scss'],
  selector: 'slide',
  animations: [
    trigger('showHide', [
      state('hidden-right', style({
        left: 'calc(100vw)',
        display: 'block',
      })),
      state('shown', style({
        left: '0px',
        display: 'block',
      })),
      state('hidden-left', style({
        left: 'calc(-100vw)',
        display: 'block',
      })),
      state('hidden', style({
        display: 'none',
      })),
      transition('hidden-right => shown', [
        animate('500ms')
      ]),
      transition('shown => hidden-left', [
        animate('500ms')
      ]),
      transition('hidden-left => hidden', []),
      transition('* => hidden-right', []),
    ]),
  ]
})
export class SlideComponent {
  animationState = 'hidden-right';

  showSlide(show: boolean) {
    if (show) {
      this.animationState = 'shown';
    } else {
      if (this.animationState == 'shown') {
        this.animationState = 'hidden-left';
      } else {
        this.animationState = 'hidden';
      }
    }
  }

  isShown() {
    return this.animationState == 'shown';
  }

  onAnimationEvent(event: AnimationEvent) {
    switch (event.toState) {
      case 'hidden-left':
        this.animationState = 'hidden';
        break;
      case 'hidden':
        this.animationState = 'hidden-right';
        break;
    }
  }
}

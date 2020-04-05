/**
 * Copyright 2020 Andreas Traber
 * Licensed under MIT (https://github.com/atraber/escapemgmt/LICENSE)
 */
import {Component, Input} from '@angular/core';

import {PresetGroup} from '../preset-group';

@Component({
  templateUrl : './preset-group-form.component.html',
  styleUrls : [ './preset-group-form.component.scss' ],
  selector : 'preset-group-form',
})
export class PresetGroupFormComponent {
  @Input() pg: PresetGroup;

  constructor() {}
}

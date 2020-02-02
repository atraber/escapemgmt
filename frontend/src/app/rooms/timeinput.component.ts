/**
 * Copyright 2019 Andreas Traber
 * Licensed under MIT (https://github.com/atraber/escapemgmt/LICENSE)
 */
import {FocusMonitor} from '@angular/cdk/a11y';
import {coerceBooleanProperty} from '@angular/cdk/coercion';
import {
  Component,
  ElementRef,
  forwardRef,
  Inject,
  Input,
  OnDestroy
} from '@angular/core';
import {
  ControlValueAccessor,
  FormBuilder,
  FormGroup,
  NG_VALUE_ACCESSOR
} from '@angular/forms';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogRef
} from '@angular/material/dialog';
import {MatFormFieldControl} from '@angular/material/form-field';
import {MatSnackBar} from '@angular/material/snack-bar';
import {MatTableDataSource} from '@angular/material/table';
import moment from 'moment';
import {Subject} from 'rxjs';

@Component({
  selector : 'time-input',
  template : `
    <div [formGroup]="parts" class="time-input-container">
      <input class="time-input-element time-input-hidden hours" formControlName="hours" placeholder="hh" size="2">
      <span class="time-input-hidden">:</span>
      <input class="time-input-element time-input-hidden minutes" formControlName="minutes" placeholder="mm" size="2">
      <span class="time-input-hidden">:</span>
      <input class="time-input-element time-input-hidden seconds" formControlName="seconds" placeholder="ss" size="2">
    </div>
  `,
  styles : [ `
    .time-input-container {
      display: flex;
    }
    .time-input-element {
      border: none;
      background: none;
      padding: 0;
      outline: none;
      font: inherit;
      text-align: center;
    }
    .time-input-hidden {
      opacity: 0;
      transition: opacity 200ms;
    }
    :host.time-input-floating .time-input-hidden {
      opacity: 1;
    }
  ` ],
  providers : [
    {provide : MatFormFieldControl, useExisting : TimeInput}, {
      provide : NG_VALUE_ACCESSOR,
      useExisting : forwardRef(() => TimeInput),
      multi : true
    }
  ],
  host : {
    '[class.time-input-floating]' : 'shouldLabelFloat',
    '[id]' : 'id',
    '[attr.aria-describedby]' : 'describedBy',
  }
})
export class TimeInput implements MatFormFieldControl<number>, OnDestroy,
                                  ControlValueAccessor {
  static nextId = 0;

  parts: FormGroup;
  stateChanges = new Subject<void>();
  focused = false;
  ngControl = null;
  controlType = 'time-input';
  id = `time-input-${TimeInput.nextId++}`;
  describedBy = '';
  private _onChange = null;

  get empty() {
    const {value : {hours, minutes, seconds}} = this.parts;

    return (!hours || hours == 0) && (!minutes || minutes == 0) &&
           (!seconds || seconds == 0);
  }

  get shouldLabelFloat() { return this.focused || !this.empty; }

  @Input()
  get placeholder(): string {
    return this._placeholder;
  }
  set placeholder(value: string) {
    this._placeholder = value;
    this.stateChanges.next();
  }
  private _placeholder: string;

  @Input()
  get required(): boolean {
    return this._required;
  }
  set required(value: boolean) {
    this._required = coerceBooleanProperty(value);
    this.stateChanges.next();
  }
  private _required = false;

  @Input()
  get disabled(): boolean {
    return this._disabled;
  }
  set disabled(value: boolean) {
    this._disabled = coerceBooleanProperty(value);
    this._disabled ? this.parts.disable() : this.parts.enable();
    this.stateChanges.next();
  }
  private _disabled = false;

  private isValid(hours: string, minutes: string, seconds: string): boolean {
    return hours.length <= 2 && minutes.length <= 2 && seconds.length <= 2 &&
           parseInt(hours) >= 0 && parseInt(hours) < 24 &&
           parseInt(minutes) >= 0 && parseInt(minutes) < 60 &&
           parseInt(seconds) >= 0 && parseInt(seconds) < 60;
  }

  get value(): number|null {
    const {value : {hours, minutes, seconds}} = this.parts;
    if (this.isValid(hours.toString(), minutes.toString(),
                     seconds.toString())) {
      let n = parseInt(hours) * 60 * 60 + parseInt(minutes) * 60 +
              parseInt(seconds);
      return n;
    }
    return null;
  }

  set value(time: number|null) {
    if (time != null) {
      let hours: number = Math.trunc(time / 60 / 60);
      let minutes: number = Math.trunc((time - hours * 60 * 60) / 60);
      let seconds: number = Math.trunc(time - hours * 60 * 60 - minutes * 60);
      this.parts.setValue({hours, minutes, seconds});
    }
    this.stateChanges.next();
  }

  get errorState() {
    if (this.empty)
      return false;
    return this.value == null;
  }

  constructor(fb: FormBuilder, private fm: FocusMonitor,
              private elRef: ElementRef<HTMLElement>) {
    this.parts = fb.group({
      hours : '',
      minutes : '',
      seconds : '',
    });

    fm.monitor(elRef, true).subscribe(origin => {
      this.focused = !!origin;
      this.stateChanges.next();
    });

    this.parts.valueChanges.subscribe(data => {
      if (this._onChange != null) {
        this._onChange(this.value);
      }
    });

    // Jump from hours to minutes
    this.parts.controls.hours.valueChanges.subscribe(data => {
      if (data.toString().length == 2) {
        let input: any =
            this.elRef.nativeElement.querySelector('input.minutes')!;
        input.focus();
        input.select();
      }
    });

    // Jump from minutes to seconds
    this.parts.controls.minutes.valueChanges.subscribe(data => {
      if (data.toString().length == 2) {
        let input: any =
            this.elRef.nativeElement.querySelector('input.seconds')!;
        input.focus();
        input.select();
      }
    });
  }

  ngOnDestroy() {
    this.stateChanges.complete();
    this.fm.stopMonitoring(this.elRef);
  }

  setDescribedByIds(ids: string[]) { this.describedBy = ids.join(' '); }

  onContainerClick(event: MouseEvent) {
    if ((event.target as Element).tagName.toLowerCase() != 'input') {
      let input: any = this.elRef.nativeElement.querySelector('input')!;
      input.focus();
      input.select();
    } else if ((event.target as Element).tagName.toLowerCase() == 'input') {
      let input: any = event.target;
      input.select();
    }
  }

  writeValue(value: number) { this.value = value; }

  registerOnChange(fn: (value: number) => void) { this._onChange = fn; }

  registerOnTouched(fn: () => void) {}
}

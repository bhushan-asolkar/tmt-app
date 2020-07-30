import { Component, OnInit, Input, OnChanges, ChangeDetectorRef, SimpleChanges, Output, EventEmitter, OnDestroy } from '@angular/core';
import { Location } from '@angular/common';
import { FormBuilder, FormGroup, Validators, FormControl, AbstractControl } from '@angular/forms';
import { SelectItem } from 'primeng/api/selectitem';
import { isNullOrUndefined } from 'util';
import { Account } from './../../../model/Account';
import { CONTACT_CENTER_TASK_DROPDOWN_DATA, TaskState, ASSIGN_TO_DROPDOWN_DATA } from 'src/app/app.constants';
import { Subscription } from 'rxjs';

@Component({
  selector: 'srca-task-detail',
  templateUrl: './task-detail.component.html',
  styleUrls: ['./task-detail.component.scss']
})
export class TaskDetailComponent implements OnInit, OnChanges, OnDestroy {

  taskPriorityData: SelectItem[];
  callCodes: SelectItem[];
  actions: SelectItem[];
  assignToOptions: SelectItem[];
  individualOptions: SelectItem[];

  taskDetailForm: FormGroup;

  accountColumns: any[];
  accounts: Account[];

  dropdownData: { [key: string]: string[] };
  assignToData: string[];

  isSaveBtnClicked: boolean;
  message: { [key: string]: string };
  formControlLabelMapping: { [key: string]: string };

  isTaskInReview: boolean;
  taskStateEnum = TaskState;

  taskCompleteSubscription: Subscription;

  @Input() taskDetailData: any;
  @Input() taskState: any;
  @Output() saveTaskDetails = new EventEmitter<any>();

  constructor(private formBuilder: FormBuilder, private cd: ChangeDetectorRef, private location: Location) { }

  /**
   * Determine if the task is in review state and update form accordingly.
   * @param changes contains the detailed change information for all input properties
   */
  ngOnChanges(changes: SimpleChanges) {
    if (changes.taskState && changes.taskState.previousValue !== changes.taskState.currentValue) {
      this.isTaskInReview = (changes.taskState.currentValue === this.taskStateEnum.REVIEW);
      if (this.isTaskInReview) {
        const taskNotCompleteFields = ['assignTo', 'individual', 'userGroup'];

        this.updateControlValidators('taskComplete');

        // check if task complete subscription exist
        if (this.taskCompleteSubscription) {
          this.taskCompleteSubscription.unsubscribe();
          this.taskCompleteSubscription = null;
        }

        this.taskCompleteSubscription = this.taskComplete.valueChanges.subscribe((value: string) => {
          if (value === 'yes') {
            this.message = null;
            this.loadAssignToOptions();
            this.loadIndividualOptions();

            taskNotCompleteFields.forEach(controlName => this.updateControlValidators(controlName));
          } else {
            taskNotCompleteFields.forEach(controlName => {
              this.updateControlValidators(controlName, true);
            });
          }
        });
      } else {
        if (this.taskDetailForm) {
          this.updateControlValidators('taskComplete', true);
        }
      }
    }
    if (changes.taskDetailData && changes.taskDetailData.previousValue !== changes.taskDetailData.currentValue) {
      setTimeout(() => {
        this.updateValues();
      });
    }
  }

  /**
   * Helper method to set or clear form control validators
   * @param controlName - name of the control
   * @param remove - should the control validations be set or clear
   */
  updateControlValidators(controlName: string, remove: boolean = false): void {
    const control: FormControl = this.taskDetailForm.get(controlName) as FormControl;
    if (remove) {
      control.clearValidators();
    } else {
      control.setValidators(Validators.required);
    }
    control.updateValueAndValidity();
    control.markAsUntouched();
  }

  /**
   * initialize the task details
   */
  ngOnInit() {
    this.dropdownData = CONTACT_CENTER_TASK_DROPDOWN_DATA;
    this.assignToData = ASSIGN_TO_DROPDOWN_DATA;

    this.formControlLabelMapping = {
      callerName: 'Caller name',
      callerPhone: 'Caller phone',
      action: 'Action',
      callCode: 'Call code',
      taxPayerIDAvailable: 'TaxPayer ID Selection',
      taxPayerID: 'TaxPayer ID',
      fullyAuthenticated: 'Fully authenticated',
      callDetails: 'Call details',
      taskComplete: 'Task complete',
      assignTo: 'Assign to',
      individual: 'Individual'
    };

    this.taskPriorityData = [
      { label: 'Low', value: 'low' },
      { label: 'High', value: 'high' }
    ];

    this.accountColumns = [
      { field: 'accountNumber', header: 'Account Number' },
      { field: 'accountName', header: 'Account Short Name' },
    ];
    this.accounts = [];

    this.initializeTaskDetailsForm();
    this.loadCallCodes();
    this.subscribeForTaxPayerIDAvailability();
  }

  initializeTaskDetailsForm(): void {
    this.taskDetailForm = this.formBuilder.group({
      callerName: [null, Validators.required],
      callerPhone: [null, Validators.required],
      action: [null, Validators.required],
      callCode: [null, Validators.required],
      taxPayerIDAvailable: [null, Validators.required],
      fullyAuthenticated: [null, Validators.required],
      taskPriority: ['low'],
      taskNotes: [null],
      callDetails: [null, Validators.required],
      taskComplete: [null],
      assignTo: [null],
      individual: [null],
      userGroup: [null]
    });
  }

  /**
   * Show Tax Payer ID input if client has indicated availability.
   */
  subscribeForTaxPayerIDAvailability(): void {
    this.taxPayerIDAvailable.valueChanges
      .subscribe((value: string) => {
        if (value === 'yes') {
          this.taskDetailForm.addControl('taxPayerID', new FormControl(null, Validators.required));
          if (!isNullOrUndefined(this.taskDetailData) && this.taskDetailData.taxpayerId) {
            this.taskDetailForm.patchValue({
              taxPayerID: this.taskDetailData.taxpayerId
            });
          }
        } else {
          this.taskDetailForm.removeControl('taxPayerID');
        }
      });
  }

  /**
   * Populate call code dropdown values
   */
  loadCallCodes(): void {
    const callCodeOptions = Object.keys(this.dropdownData).map((key: string) => {
      return {
        label: key, value: key
      };
    });

    this.callCodes = [{ label: 'Select Call Code', value: null }, ...callCodeOptions];
  }

  /**
   * Update the action dropdown depending on selected call code value
   * @param callCodeValue value of call code dropdown
   */
  loadActionByCallCode(callCodeValue: string): void {
    if (!callCodeValue) {
      this.actions = [];
      return;
    }

    this.action.setValue(null);
    const actionOptions = this.dropdownData[callCodeValue].map(action => {
      return {
        label: action, value: action
      };
    });

    this.actions = [{ label: 'Select Action', value: null }, ...actionOptions];
  }

  /**
   * If task is incomplete, populate assign to dropdown for task assignment
   */
  loadAssignToOptions(): void {
    const assignToValues = this.assignToData.map((key: string) => {
      return {
        label: key, value: key
      };
    });

    this.assignToOptions = [{ label: 'Select Assign To', value: null }, ...assignToValues];
  }

  /**
   * Populate individual dropdown data if assignTo is individual
   */
  loadIndividualOptions(): void {
    // TODO - fetch from API
    this.individualOptions = [
      { label: 'Select Individual', value: null },
      { label: 'Pascal, Chan', value: 'Pascal, Chan' },
      { label: 'Meyer, Steffie', value: 'Meyer, Steffie' },
      { label: 'Cranston, John', value: 'Cranston, John' },
    ];
  }

  /**
   * Update user group based on the value selected in the individual field
   */
  onIndividualSelection(): void {
    // TODO - fetch from API
    this.userGroup.setValue('WM NC-Philanthropic CS (Inactive)');
  }

  get callerName(): FormControl {
    return this.taskDetailForm.get('callerName') as FormControl;
  }

  get callerPhone(): FormControl {
    return this.taskDetailForm.get('callerPhone') as FormControl;
  }

  get callCode(): FormControl {
    return this.taskDetailForm.get('callCode') as FormControl;
  }

  get action(): FormControl {
    return this.taskDetailForm.get('action') as FormControl;
  }

  get taxPayerID(): FormControl {
    return this.taskDetailForm.get('taxPayerID') as FormControl;
  }

  get taxPayerIDAvailable(): FormControl {
    return this.taskDetailForm.get('taxPayerIDAvailable') as FormControl;
  }

  get fullyAuthenticated(): FormControl {
    return this.taskDetailForm.get('fullyAuthenticated') as FormControl;
  }

  get taskPriority(): FormControl {
    return this.taskDetailForm.get('taskPriority') as FormControl;
  }

  get callDetails(): FormControl {
    return this.taskDetailForm.get('callDetails') as FormControl;
  }

  get taskNotes(): FormControl {
    return this.taskDetailForm.get('taskNotes') as FormControl;
  }

  get taskComplete(): FormControl {
    return this.taskDetailForm.get('taskComplete') as FormControl;
  }

  get assignTo(): FormControl {
    return this.taskDetailForm.get('assignTo') as FormControl;
  }

  get individual(): FormControl {
    return this.taskDetailForm.get('individual') as FormControl;
  }

  get userGroup(): FormControl {
    return this.taskDetailForm.get('userGroup') as FormControl;
  }

  /**
   * In case of task edit scenario, update the form with existing task information
   */
  updateValues() {
    if (!isNullOrUndefined(this.taskDetailData)) {
      this.taskDetailForm.setValue({
        callerName: this.taskDetailData.callerName,
        callerPhone: this.taskDetailData.callerPhone,
        action: this.taskDetailData.action,
        callCode: this.taskDetailData.callCode,
        taxPayerIDAvailable: this.taskDetailData.isTaxpayerId,
        fullyAuthenticated: this.taskDetailData.fullyAuthenticated,
        taskPriority: this.taskDetailData.taskPriority,
        callDetails: this.taskDetailData.callDetails,
        taskNotes: this.taskDetailData.taskNotes
      });
      this.loadActionByCallCode(this.taskDetailData.callCode);
      if (this.taskDetailData.action) {
        this.taskDetailForm.patchValue({
          action: this.taskDetailData.action
        });
      }
    }
    this.cd.detectChanges();
  }

  /**
   * If the form is valid, submit the contact center task details form.
   * Else, show error message to the user
   */
  onSubmit() {
    this.isSaveBtnClicked = true;
    if (this.taskDetailForm.valid) {
      // API call to persist data
      this.saveTaskDetails.emit(this.taskDetailForm.value);
      // update taxPayerIDAvailable before form reset to hide the taxPayerID field
      this.taxPayerIDAvailable.setValue(null);
      this.taskDetailForm.reset();
      // on API success
      this.message = {
        cssClass: 'alert alert-success',
        text: 'Form submitted successfully'
      };
    } else {
      // find error controls and show error message
      let errorControls = '';
      let errorControlsCount = 0;
      Object.entries(this.taskDetailForm.controls)
        .filter((control: [string, AbstractControl]) => !control[1].valid)
        .forEach((control: [string, AbstractControl], index: number, controls: [string, AbstractControl][]) => {
          errorControls += this.formControlLabelMapping[control[0]];
          errorControlsCount++;
          if (index < controls.length - 1) {
            errorControls += ', ';
          }
        });
      this.message = {
        cssClass: 'alert alert-danger',
        text: `${errorControls} ${errorControlsCount === 1 ? 'field is' : 'fields are'} mandatory.`
      };
      this.taskDetailForm.markAllAsTouched();
    }
  }

  /**
   * Component cleanup
   */
  ngOnDestroy() {
    if (this.taskCompleteSubscription) {
      this.taskCompleteSubscription.unsubscribe();
      this.taskCompleteSubscription = null;
    }
  }
}

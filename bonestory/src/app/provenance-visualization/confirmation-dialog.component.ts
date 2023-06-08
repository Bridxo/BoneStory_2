import { Component } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-confirmation-dialog',
  templateUrl: 'confirmation-dialog.component.html',
})
export class ConfirmationDialogComponent {

  constructor(
    public dialogRef: MatDialogRef<ConfirmationDialogComponent>) {}

  onOptionA(): void {
    this.dialogRef.close('Delete only selected node');
  }

  onOptionB(): void {
    this.dialogRef.close('Delete the selected node and all its descendants');
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
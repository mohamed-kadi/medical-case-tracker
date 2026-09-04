import { Pipe, PipeTransform } from '@angular/core';

import { I18nService } from '../core/services/i18n.service';

const REASON_KEYS: Record<string, string> = {
  GENERAL_CONSULTATION: 'appointments.reason.generalConsultation',
  FOLLOW_UP: 'appointments.reason.followUp',
  NEW_CONCERN: 'appointments.reason.newConcern',
  PROCEDURE: 'appointments.reason.procedure',
  RESULTS_REVIEW: 'appointments.reason.resultsReview'
};

@Pipe({ name: 'appointmentReason', standalone: true, pure: false })
export class AppointmentReasonPipe implements PipeTransform {
  constructor(private readonly i18n: I18nService) {}

  transform(reason: string | null | undefined): string {
    if (!reason) {
      return '-';
    }
    const key = REASON_KEYS[reason];
    return key ? this.i18n.t(key) : reason;
  }
}

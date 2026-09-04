import { ConfirmationService } from './confirmation.service';

describe('ConfirmationService', () => {
  it('exposes an in-app confirmation request and resolves it', async () => {
    const service = new ConfirmationService();

    const result = service.confirm('appointments.cancel.confirm', {
      titleKey: 'appointments.cancel.title',
      confirmKey: 'appointments.cancel.action',
      tone: 'danger'
    });

    expect(service.request()).toEqual({
      titleKey: 'appointments.cancel.title',
      messageKey: 'appointments.cancel.confirm',
      confirmKey: 'appointments.cancel.action',
      cancelKey: 'confirmation.cancel',
      tone: 'danger'
    });

    service.resolve(true);

    await expectAsync(result).toBeResolvedTo(true);
    expect(service.request()).toBeNull();
  });

  it('safely dismisses an older request when a new one opens', async () => {
    const service = new ConfirmationService();
    const firstResult = service.confirm('first');

    const secondResult = service.confirm('second');

    await expectAsync(firstResult).toBeResolvedTo(false);
    expect(service.request()?.messageKey).toBe('second');
    service.resolve(false);
    await expectAsync(secondResult).toBeResolvedTo(false);
  });
});

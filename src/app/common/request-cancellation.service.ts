import {Injectable} from '@angular/core';
import {Subject} from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class RequestCancellationService {
  private cancellationSubjects = new Map<string, Subject<void>>();

  getCancellationSubject(requestId: string): Subject<void> {
    if (!this.cancellationSubjects.has(requestId)) {
      this.cancellationSubjects.set(requestId, new Subject<void>());
    }
    return this.cancellationSubjects.get(requestId)!;
  }

  cancelRequest(requestId: string): void {
    const subject = this.cancellationSubjects.get(requestId);
    if (subject) {
      subject.next();
      subject.complete();
      this.cancellationSubjects.delete(requestId);
    }
  }

  finishRequest(requestId: string): void {
    const subject = this.cancellationSubjects.get(requestId);
    if (subject) {
      subject.complete();
      this.cancellationSubjects.delete(requestId);
    }
  }
}

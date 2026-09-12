import { Pipe, PipeTransform } from '@angular/core';
import { duration } from './statistics';
@Pipe({ name: 'duration' })
export class DurationPipe implements PipeTransform {
  transform(minutes: number): string {
    return duration(minutes);
  }
}

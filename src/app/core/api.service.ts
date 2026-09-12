import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { APP_CONFIG } from './config';
import {
  Credentials,
  Message,
  Page,
  ProfileInput,
  SignInResponse,
  Skill,
  SkillInput,
  TimeEntry,
  TimeInput,
  User,
} from './models';
@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);
  private readonly base = inject(APP_CONFIG).apiUrl;
  signIn(body: Credentials) {
    return firstValueFrom(this.http.post<SignInResponse>(`${this.base}/users/sign_in`, body));
  }
  signUp(body: ProfileInput & { password: string }) {
    return firstValueFrom(this.http.post<Message>(`${this.base}/users/sign_up`, body));
  }
  forgotPassword(email: string) {
    return firstValueFrom(this.http.post<Message>(`${this.base}/users/forgot_password`, { email }));
  }
  profile() {
    return firstValueFrom(this.http.get<{ user: User }>(`${this.base}/users/profile`));
  }
  updateProfile(body: ProfileInput) {
    return firstValueFrom(this.http.patch<Message>(`${this.base}/users/profile`, body));
  }
  deleteProfile() {
    return firstValueFrom(this.http.delete<Message>(`${this.base}/users/profile`));
  }
  redefinePassword(body: { password: string; new_password: string }) {
    return firstValueFrom(this.http.post<Message>(`${this.base}/users/redefine_password`, body));
  }
  skills(page: number) {
    return firstValueFrom(
      this.http.get<Page<Skill>>(`${this.base}/skills/skills_by_page`, { params: { page } }),
    );
  }
  allSkills() {
    return firstValueFrom(
      this.http.get<{ skills: Skill[] }>(`${this.base}/skills/skills_from_user`),
    );
  }
  skill(id: string) {
    return firstValueFrom(
      this.http.get<{ skill: Skill }>(`${this.base}/skills/skill_by_id/${encodeURIComponent(id)}`),
    );
  }
  createSkill(body: SkillInput) {
    return firstValueFrom(this.http.post<Message>(`${this.base}/skills/create_skill`, body));
  }
  updateSkill(id: string, body: SkillInput) {
    return firstValueFrom(
      this.http.put<Message>(
        `${this.base}/skills/update_skill_by_id/${encodeURIComponent(id)}`,
        body,
      ),
    );
  }
  deleteSkill(id: string) {
    return firstValueFrom(
      this.http.delete<Message>(`${this.base}/skills/delete_skill_by_id/${encodeURIComponent(id)}`),
    );
  }
  times(page: number) {
    return firstValueFrom(
      this.http.get<Page<TimeEntry>>(`${this.base}/times/times_by_page`, { params: { page } }),
    );
  }
  timesByDate(id: string, initial: string, final: string) {
    return firstValueFrom(
      this.http.get<{ times: TimeEntry[] }>(`${this.base}/times/times_by_date`, {
        params: { skill_id: id, date_initial: initial, date_final: final },
      }),
    );
  }
  time(id: string) {
    return firstValueFrom(
      this.http.get<{ time: TimeEntry }>(`${this.base}/times/time_by_id/${encodeURIComponent(id)}`),
    );
  }
  createTime(body: TimeInput) {
    return firstValueFrom(this.http.post<Message>(`${this.base}/times/create_time`, body));
  }
  updateTime(id: string, body: TimeInput) {
    return firstValueFrom(
      this.http.put<Message>(
        `${this.base}/times/update_time_by_id/${encodeURIComponent(id)}`,
        body,
      ),
    );
  }
  deleteTime(id: string) {
    return firstValueFrom(
      this.http.delete<Message>(`${this.base}/times/delete_time_by_id/${encodeURIComponent(id)}`),
    );
  }
}

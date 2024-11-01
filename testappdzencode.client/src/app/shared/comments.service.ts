import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Comment } from './comment.model';
import { Observable, Subject } from 'rxjs';

export interface ResponseStructure{
  comments: Comment[]; 
  totalCount: number;
}

@Injectable({
  providedIn: 'root'
})

export class CommentsService {

  private responseEventSubject = new Subject<void>();
  responseEvent$ = this.responseEventSubject.asObservable();
  
  apiUrl:string = environment.apiBaseUrl + '/Comments';

  commentsList:Comment[] = [];
  totalCountComments:number = 0;
  itemsPerPage:number = 25;
  currentPage:number = 1;
  totalPages:number = 0;

  sortBy:string = 'created_at';
  sortOrder:string = 'DESC';

  constructor(private http:HttpClient) { }

  refreshList(){
    this.http.get<ResponseStructure>(this.getFullUrlWithParameters()).subscribe({
      next: res => {
        this.parseData(res);
      },
      error: err => {console.log(err)}
    }
    );
  }

  parseData(res:ResponseStructure) {
    this.commentsList = res.comments as Comment[];
    this.totalCountComments = res.totalCount;
    this.totalPages = Math.ceil(this.totalCountComments / this.itemsPerPage);
    this.responseEventSubject.next();
  }

  submitComment(comment: Comment): Observable<ResponseStructure> {
    const formData = new FormData();

    formData.append('userName', comment.userName);
    formData.append('email', comment.email);
    formData.append('content', comment.content);

    // Добавляем необязательные поля, если они существуют
    if (comment.homePage) {
      formData.append('homePage', comment.homePage);
    }

    if (comment.filePath && typeof comment.filePath !== 'string') {
      // Проверяем, что filePath не является строкой, а объектом File
      formData.append('file', comment.filePath as File, (comment.filePath as File).name);
    }
    if (comment.parentId !== undefined && comment.parentId !== null) {
      formData.append('parentId', comment.parentId.toString());
    }

    // Логируем содержимое FormData для проверки
    /*console.log('FormData content:');
    formData.forEach((value, key) => {
      console.log(`${key}: ${value}`);
    });*/

    return this.http.post<ResponseStructure>(this.getFullUrlWithParameters(), formData);
  }

  getFullUrlWithParameters():string {
    return `${this.apiUrl}?page=${this.currentPage}&sortBy=${this.sortBy}&sortOrder=${this.sortOrder}`;
  }
}

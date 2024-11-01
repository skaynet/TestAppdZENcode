import { Component, OnInit, ViewChild } from '@angular/core';
import { CommentsService } from '../shared/comments.service';
import { CommentFormComponent } from './comment-form/comment-form.component';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-comments',
  templateUrl: './comments.component.html',
  styles: ``
})
export class CommentsComponent implements OnInit {

  pageNumbers: number[] = [];
  private responseSubscription!: Subscription;

  @ViewChild(CommentFormComponent) commentFormComponent!: CommentFormComponent;

  constructor(public service:CommentsService) {
  }

  ngOnInit(): void {
    this.responseSubscription = this.service.responseEvent$.subscribe(() => {
      this.updatePageNumbers();
    });
    this.service.refreshList();
  }

  openModalFromComments() {
    this.commentFormComponent.openModal();
  }

  onReplyToComment(commentId: number): void {
    this.commentFormComponent.openModal(commentId);
  }

  // Метод для обновления списка кнопок с номерами страниц
  updatePageNumbers(): void {
    const visiblePages = 5;
    const startPage = Math.max(1, this.service.currentPage - Math.floor(visiblePages / 2));
    const endPage = Math.min(this.service.totalPages, startPage + visiblePages - 1);

    this.pageNumbers = [];
    for (let i = startPage; i <= endPage; i++) {
      this.pageNumbers.push(i);
    }
  }

  // Метод для перехода к конкретной странице
  goToPage(page: number): void {
    if (page >= 1 && page <= this.service.totalPages) {
      this.service.currentPage = page;
      this.service.refreshList();
    }
  }

  // Методы для перехода на предыдущую и следующую страницу
  goToPreviousPage(): void {
    if (this.service.currentPage > 1) {
      this.goToPage(this.service.currentPage - 1);
    }
  }

  goToNextPage(): void {
    if (this.service.currentPage < this.service.totalPages) {
      this.goToPage(this.service.currentPage + 1);
    }
  }

  setSortOption(sortBy:string, sortOrder:string = 'ASC') : void {
    this.service.sortBy = sortBy;
    this.service.sortOrder = sortOrder;
    this.service.refreshList();
  }
}

import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { Comment } from '../../shared/comment.model';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-comment',
  templateUrl: './comment.component.html',
  styles: ``
})
export class CommentComponent implements OnInit, OnDestroy{
  
  @Input() comment!: Comment;
  @Input() isPreview: boolean = false;
  @Output() replyEvent = new EventEmitter<number>();

  fileUrl?: string; // URL для предварительного просмотра изображения
  private objectUrl?: string; // Для отслеживания локального URL

  ngOnInit(): void {
    this.updateFileUrl();
  }

  ngOnDestroy(): void {
    // Освободим URL, если был создан
    if (this.objectUrl) {
      URL.revokeObjectURL(this.objectUrl);
    }
  }

  updateFileUrl(): void {
    /*if (this.comment.filePath && (this.comment.filePath as unknown as File).type?.startsWith('image/')) {
      const file = (this.comment.filePath as unknown as File);
      this.objectUrl = URL.createObjectURL(file);
      const fileExtension = file.name.split('.').pop(); // Получаем расширение файла
      this.fileUrl = `${this.objectUrl}.${fileExtension}`;
    } else */
    if (typeof this.comment.filePath === 'string') {
      this.fileUrl = environment.fileBaseUrl + this.comment.filePath;
    }
  }

  isImage(filePath: string): boolean {
    return /\.(jpg|jpeg|png|gif)$/i.test(filePath);
  }

  isTextFile(filePath: string): boolean {
    return /\.txt$/i.test(filePath);
  }

  replyToComment(): void {
    if (this.comment.id) {
      this.replyEvent.emit(this.comment.id);  // Эмитим событие с id комментария
    }
  }
}

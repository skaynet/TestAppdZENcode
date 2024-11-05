import { Component, EventEmitter, Input, OnDestroy, OnInit, Output, ViewChild, ElementRef } from '@angular/core';
import { Comment } from '../../shared/comment.model';
import { environment } from '../../../environments/environment';
import { CommentsService } from '../../shared/comments.service';

@Component({
  selector: 'app-comment',
  templateUrl: './comment.component.html',
  styles: ``
})
export class CommentComponent implements OnInit, OnDestroy{
  
  @Input() comment!: Comment;
  @Input() isPreview: boolean = false;
  @Output() replyEvent = new EventEmitter<number>();

  @ViewChild('commentViewTxtFileModal', { static: true }) commentModal!: ElementRef;

  fileUrl?: string; // URL для предварительного просмотра изображения
  fileContent: string | null = null;
  private objectUrl?: string; // Для отслеживания локального URL
  private modalInstance: any;

  constructor(public service: CommentsService) { }

  ngOnInit(): void {
    this.updateFileUrl();
  }

  ngAfterViewInit() {
    this.modalInstance = new (window as any).bootstrap.Modal(this.commentModal.nativeElement);
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

  getUploadFileName(): string {
    if (this.comment.filePath && (this.comment.filePath as unknown as File)) {
      const file = (this.comment.filePath as unknown as File);
      return file.name;
    }
    else {
      return '';
    }
  }

  loadFileTxt(): void {
    if (typeof this.comment.filePath === 'string') {
      this.service.loadFileTxt(this.comment.filePath).subscribe({
        next: res => {
          this.fileContent = res;
          this.modalInstance.show();
        },
        error: err => {
          console.log(err);
        }
      });
    }
  }

  openModalViewTxtFile(event: MouseEvent): void {
    event.preventDefault(); // предотвращаем открытие ссылки
    if (this.fileContent) {
      this.modalInstance.show();
    } else {
      this.loadFileTxt();
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

import { Component, OnInit, ElementRef, ViewChild } from '@angular/core';
import { CommentsService } from '../../shared/comments.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Comment } from '../../shared/comment.model';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-comment-form',
  templateUrl: './comment-form.component.html',
  styles: ``
})
export class CommentFormComponent implements OnInit {

  commentForm!: FormGroup;
  captchaText!: string;
  fileError: boolean = false;
  previewComment: Comment = {
    userName: '',
    email: '',
    content: '',
    filePath: '',
    createdAt: new Date(),
    homePage: ''
  };

  //captchaCanvas объявляется с помощью декоратора @ViewChild
  @ViewChild('captchaCanvas', { static: true }) captchaCanvas?: ElementRef<HTMLCanvasElement>;
  @ViewChild('fileInput') fileInput!: any;  // Захватываем ссылку на элемент файла
  @ViewChild('commentTextArea') commentTextArea!: ElementRef<HTMLTextAreaElement>;
  @ViewChild('commentModal', { static: true }) commentModal!: ElementRef;
  @ViewChild('confirmAddCommentModal', { static: true }) confirmAddCommentModal!: ElementRef;

  private modalInstance: any;
  private modalConfirmInstance: any;

  constructor(public services:CommentsService, private fb: FormBuilder, private toastr:ToastrService){
  }

  ngAfterViewInit() {
    this.modalInstance = new (window as any).bootstrap.Modal(this.commentModal.nativeElement);
    this.modalConfirmInstance = new (window as any).bootstrap.Modal(this.confirmAddCommentModal.nativeElement);
  }

  openModal(parentId:number = 0) {
    if (this.modalInstance) {
      this.resetForm();
      this.modalInstance.show();
      if(parentId > 0)
      {
        this.commentForm.get('parentId')?.setValue(parentId);
      }
    }
  }

  ngOnInit(): void {
    this.commentForm = this.fb.group({
      userName: ['', [Validators.required, Validators.pattern('[A-Za-z0-9]+')]],
      email: ['', [Validators.required, Validators.email]],
      homePage: ['', [Validators.pattern('https?://.+')]],
      content: ['', Validators.required],
      captcha: ['', [Validators.required, Validators.pattern('[A-Za-z0-9]+')]],
      filePath: [null],
      parentId: [null],
      createdAt: [new Date()]
    });

    this.commentForm.valueChanges.subscribe(values => {
      this.previewComment = {
        ...values,
        createdAt: new Date()
      };
    });
    this.generateCaptcha();
  }

  nextPreviewComment():void
  {
    if (this.commentForm.valid) {
      if(this.commentForm.get('captcha')?.value === this.captchaText)
      {
        // Проверяем, что нет открытых тегов, которые не закрыты
        if (!this.hasUnclosedTags(this.commentForm.get('content')?.value)) {
          // Очищаем комментарий от недопустимых тегов
          const cleanedComment = this.sanitizeComment(this.commentForm.get('content')?.value || '');
          this.commentForm.get('content')?.setValue(cleanedComment);
          this.modalInstance.hide();
          this.modalConfirmInstance.show();
        } else {
          this.toastr.warning('Есть незакрытые теги. Пожалуйста, закройте их.');
        }
      }
      else
      {
        this.toastr.error('Captcha не верная', 'Captcha');
      }
    } else {
      console.log('Form is invalid');
    }
  }

  onSubmit(): void {
    if (this.commentForm.valid) {
      const newComment: Comment = this.commentForm.value;
      //console.log('Submitted Comment:', newComment);
      if(this.commentForm.get('captcha')?.value === this.captchaText)
      {
        // Очищаем комментарий от недопустимых тегов
        const cleanedComment = this.sanitizeComment(this.commentForm.get('content')?.value || '');
        this.commentForm.get('content')?.setValue(cleanedComment);
        // Проверяем, что нет открытых тегов, которые не закрыты
        if (!this.hasUnclosedTags(this.commentForm.get('content')?.value)) {
        // Отправка комментария
        this.services.submitComment(newComment)
        .subscribe({
          next: res => {
            this.services.parseData(res);
            this.toastr.success('Комментарий успешно добавлен', 'Добавление комментария');
            //this.resetForm();
            this.modalConfirmInstance.hide();
          },
          error: err => {
            console.log(err);
            this.toastr.error('Ошибка добавления комментария', 'Добавление комментария');
          }
        })
        } else {
          this.toastr.warning('Есть незакрытые теги. Пожалуйста, закройте их.');
        }
      }
      else
      {
        this.toastr.error('Captcha не верная', 'Captcha');
      }
    } else {
      console.log('Form is invalid');
    }
  }

  resetForm(): void {
    this.commentForm.reset();
    this.fileInput.nativeElement.value = '';
    this.generateCaptcha();
  }

  onFileChange(event: any): void {
    const file:File = event.target.files[0];

    if (!file) {
      return;
    }
    this.fileError = false;
    const fileType = file.type;
  
    // Проверка типа файла
    if (fileType.startsWith('image/')) {
      // Если это изображение, проверяем его размеры, и если нужно пропорционально уменьшаем изображение
      this.checkAndResizeImage(file)
        .then((resizedFile) => {
          this.commentForm.patchValue({ filePath: resizedFile });
        })
        .catch((error) => {
          console.error('Error resizing image:', error);
        });
    } else if (fileType === 'text/plain') {
      // Если это текстовый файл, проверяем его размер
      if (file.size > 102400) { // 100 КБ
        this.toastr.error('Размер текстового файла превышает 100 КБ.', 'Ошибка добавление файла');
        this.fileError = true;
        return;
      }
      //console.log('Текстовый файл принят.');
      this.commentForm.patchValue({ filePath: file });
    } else {
      this.toastr.error('Недопустимый тип файла. Допускаются только изображения и текстовые файлы.', 'Ошибка добавление файла');
      this.fileError = true;
      return;
    }
  }
  
  checkAndResizeImage(file: File): Promise<File> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const reader = new FileReader();
  
      reader.onload = (event) => {
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject('Unable to get canvas context');
            return;
          }
  
          const maxWidth = 320;
          const maxHeight = 240;
          let { width, height } = img;
  
          // Проверка на необходимость изменения размеров
          if (width > maxWidth || height > maxHeight) {
            const ratio = Math.min(maxWidth / width, maxHeight / height);
            width = width * ratio;
            height = height * ratio;
  
            // Пропорциональное уменьшение и перерисовка
            canvas.width = width;
            canvas.height = height;
            ctx.drawImage(img, 0, 0, width, height);
  
            canvas.toBlob((blob) => {
              if (blob) {
                const resizedFile = new File([blob], file.name, {
                  type: file.type,
                  lastModified: Date.now(),
                });
                resolve(resizedFile);
              } else {
                reject('Image conversion to Blob failed');
              }
            }, file.type);
          } else {
            // Если размеры соответствуют заданным, возвращаем оригинальный файл
            resolve(file);
          }
        };
      };
  
      reader.onerror = () => {
        reject('Error reading file');
      };
  
      reader.readAsDataURL(file);
    });
  }

  // Метод для вставки тега в текстовое поле
  insertTag(openTag: string, closeTag: string): void {
    const textarea: HTMLTextAreaElement = this.commentTextArea.nativeElement;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;

    // Проверяем, что нет открытых тегов, которые не закрыты
    const existingText = text.substring(0, start) + openTag + text.substring(start, end) + closeTag + text.substring(end);
    if (!this.hasUnclosedTags(existingText)) {
      // Вставка тега, если проверка прошла
      const newText = text.substring(0, start) + openTag + text.substring(start, end) + closeTag + text.substring(end);
      this.commentForm.get('content')?.setValue(newText);

      // Перемещение курсора после закрывающего тега
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + openTag.length;
        textarea.focus();
      }, 0);
    } else {
      this.toastr.warning('Есть незакрытые теги. Пожалуйста, закройте их.');
    }
  }

  // Проверка на незакрытые теги
  hasUnclosedTags(text: string): boolean {
    const tagPattern = /<\/?([a-z]+)[^>]*>/gi;
    const stack: string[] = [];
    let match;

    while ((match = tagPattern.exec(text)) !== null) {
      const [tag, tagName] = match;

      // Если это открывающий тег, добавляем его в стек
      if (!tag.startsWith('</')) {
        stack.push(tagName);
      } 
      // Если это закрывающий тег
      else {
        if (stack.length === 0 || stack.pop() !== tagName) {
          return true; // Обнаружен незакрытый тег
        }
      }
    }
    return stack.length > 0;
  }

  // Функция для очистки комментариев
  sanitizeComment(input: string): string {
    const allowedTagsRegex = /^<\/?(a|code|i|strong)(\s+[^<>]*)?>$/i;
    const allowedAttributesRegex = /^(href|title)\s*=\s*("[^"]*"|'[^']*')$/i;
  
    return input.replace(/<[^>]+>/g, (tag) => {
      // Проверка на разрешенные теги, включая закрывающие
      if (allowedTagsRegex.test(tag)) {
        // Если тег <a>, то фильтруем атрибуты
        if (/^<a\s+/i.test(tag)) {
          // Извлекаем и фильтруем разрешенные атрибуты
          const filteredAttributes = tag.match(/(\w+\s*=\s*('[^']*'|"[^"]*"))/gi)
            ?.filter(attribute => allowedAttributesRegex.test(attribute))
            .join(" ") || ""; // Собираем строку атрибутов с пробелами между ними
          
          // Восстанавливаем тег <a> с разрешенными атрибутами
          return `<a ${filteredAttributes}>`;
        }
        // Возвращаем разрешенные теги без изменения
        return tag;
      }
      // Удаляем неразрешенные теги
      return "";
    });
  }
////////////////////CAPTCHA////////////////////////////
  generateCaptcha() {
    this.captchaText = this.randomString(6); // Генерация строки из 6 символов
    this.drawCaptcha();
  }

  randomString(length: number): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  drawCaptcha() {
    if (!this.captchaCanvas) return; // Проверяем, что canvas существует
    const canvas = this.captchaCanvas.nativeElement;
    const ctx = canvas.getContext('2d');

    // Проверяем, что контекст рисования не равен null
    if (ctx) {
      canvas.width = 200; // Ширина
      canvas.height = 50; // Высота
  
      // Генерация случайного фона
      ctx.fillStyle = this.randomColor();
      ctx.fillRect(0, 0, canvas.width, canvas.height);
  
      // Настройка шрифта
      ctx.font = '30px Arial';
      ctx.fillStyle = 'white';
      ctx.textAlign = 'center';
      ctx.fillText(this.captchaText, canvas.width / 2, canvas.height / 1.5);
    } else {
      console.error('Unable to get canvas context');
    }
  }

  randomColor(): string {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
  }
}

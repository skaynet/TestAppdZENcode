export interface Comment {
    id?: number;
    parentId?: number;  // Необязательное поле
    userName: string;
    email: string;
    homePage?: string;  // Необязательное поле
    content: string;
    filePath?: string;  // Необязательное поле
    createdAt?: Date;   // Необязательное поле
    children?: Comment[]; // Массив дочерних комментариев
    parent?: Comment;   // Родительский комментарий
  }

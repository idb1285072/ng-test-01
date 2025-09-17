import { Component, EventEmitter, Input, Output } from '@angular/core';

export interface PaginationEvent {
  currentPage: number;
  itemsPerPage: number;
}

@Component({
  selector: 'app-pagination',
  templateUrl: './pagination.component.html',
  styleUrls: ['./pagination.component.css'],
})
export class PaginationComponent {
  @Input() totalItems: number = 0;
  @Input() itemsPerPage: number = 5;
  @Input() currentPage: number = 1;
  @Input() pageSizes: number[] = [5, 10, 20, 50];

  @Output() pageChange = new EventEmitter<PaginationEvent>();

  changePage(page: number) {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
    this.emitChange();
  }

  changePageSize(size: number) {
    this.itemsPerPage = size;
    this.currentPage = 1;
    this.emitChange();
  }

  private emitChange() {
    this.pageChange.emit({
      currentPage: this.currentPage,
      itemsPerPage: this.itemsPerPage,
    });
  }

  get totalPages(): number {
    return Math.ceil(this.totalItems / this.itemsPerPage) || 1;
  }

  get pages(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }
}

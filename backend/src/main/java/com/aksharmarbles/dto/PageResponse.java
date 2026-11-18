package com.aksharmarbles.dto;

import java.util.List;

public class PageResponse<T> {

    private List<T> items;
    private Pagination pagination;

    public PageResponse() {
    }

    public PageResponse(List<T> items, int page, int size, long totalItems) {
        this.items = items;
        this.pagination = new Pagination(page, size, totalItems);
    }

    public static <T> PageResponse<T> of(List<T> items, int page, int size, long totalItems) {
        return new PageResponse<>(items, page, size, totalItems);
    }

    public int getPage() {
        return pagination != null ? pagination.getPage() : 1;
    }

    public int getSize() {
        return pagination != null ? pagination.getSize() : 0;
    }

    public long getTotalItems() {
        return pagination != null ? pagination.getTotalItems() : 0;
    }

    public int getTotalPages() {
        return pagination != null ? pagination.getTotalPages() : 0;
    }

    public List<T> getItems() {
        return items;
    }

    public void setItems(List<T> items) {
        this.items = items;
    }

    public Pagination getPagination() {
        return pagination;
    }

    public void setPagination(Pagination pagination) {
        this.pagination = pagination;
    }

    public static class Pagination {
        private int page;
        private int size;
        private long totalItems;
        private int totalPages;

        public Pagination() {
        }

        public Pagination(int page, int size, long totalItems) {
            this.page = page;
            this.size = size;
            this.totalItems = totalItems;
            this.totalPages = size > 0 ? (int) Math.ceil((double) totalItems / size) : 0;
        }

        public int getPage() {
            return page;
        }

        public int getSize() {
            return size;
        }

        public long getTotalItems() {
            return totalItems;
        }

        public int getTotalPages() {
            return totalPages;
        }
    }
}

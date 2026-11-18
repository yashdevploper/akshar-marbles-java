package com.aksharmarbles.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "website_pages")
public class WebsitePage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "page_id", columnDefinition = "INT UNSIGNED")
    private Long pageId;

    @Column(name = "page_name", nullable = false, length = 100)
    private String pageName;

    @Column(name = "page_filename", nullable = false, unique = true, length = 150)
    private String pageFilename;

    @Column(name = "page_type", nullable = false, columnDefinition = "ENUM('admin','customer','public')")
    @Convert(converter = PageTypeConverter.class)
    private PageType pageType = PageType.public_page;

    @Column(name = "description", length = 255)
    private String description;

    @Column(name = "created_at", nullable = false, insertable = false, updatable = false, columnDefinition = "TIMESTAMP")
    private LocalDateTime createdAt;

    public WebsitePage() {
    }

    public Long getPageId() {
        return pageId;
    }

    public void setPageId(Long pageId) {
        this.pageId = pageId;
    }

    public String getPageName() {
        return pageName;
    }

    public void setPageName(String pageName) {
        this.pageName = pageName;
    }

    public String getPageFilename() {
        return pageFilename;
    }

    public void setPageFilename(String pageFilename) {
        this.pageFilename = pageFilename;
    }

    public PageType getPageType() {
        return pageType;
    }

    public void setPageType(PageType pageType) {
        this.pageType = pageType;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
}

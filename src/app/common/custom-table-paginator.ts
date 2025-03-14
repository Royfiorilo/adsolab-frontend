import {Injectable} from "@angular/core";
import {MatPaginatorIntl} from "@angular/material/paginator";
import {TranslateParser, TranslateService} from "@ngx-translate/core";

@Injectable()
export class CustomTablePaginator extends MatPaginatorIntl {

  private rangeLabelIntl: string = '';

  constructor(private translateService: TranslateService, private translateParser: TranslateParser) {
    super();

    this.getTranslations();

    this.translateService.onLangChange.subscribe(() => this.getTranslations());
  }

  getTranslations() {
    this.translateService.get([
      'PAGINATOR.FIRST_PAGE',
      'PAGINATOR.LAST_PAGE',
      'PAGINATOR.ITEMS_PER_PAGE',
      'PAGINATOR.NEXT_PAGE',
      'PAGINATOR.PREVIOUS_PAGE',
      'PAGINATOR.RANGE'
    ])
      .subscribe(translation => {
        this.firstPageLabel = translation['PAGINATOR.FIRST_PAGE'];
        this.lastPageLabel = translation['PAGINATOR.LAST_PAGE'];
        this.itemsPerPageLabel = translation['PAGINATOR.ITEMS_PER_PAGE'];
        this.nextPageLabel = translation['PAGINATOR.NEXT_PAGE'];
        this.previousPageLabel = translation['PAGINATOR.PREVIOUS_PAGE'];
        this.rangeLabelIntl = translation['PAGINATOR.RANGE'];
        this.changes.next();
      });
  }

  override getRangeLabel = (page: number, pageSize: number, length: number) => {
    const amountPages = Math.ceil(length / pageSize);
    return this.translateParser.interpolate(this.rangeLabelIntl, {page: page + 1, amountPages, length}) ?? '';
  };

}

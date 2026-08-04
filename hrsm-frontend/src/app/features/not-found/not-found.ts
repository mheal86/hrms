import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { Button } from 'primeng/button';

@Component({
  selector: 'app-not-found',
  imports: [RouterLink, TranslatePipe, Button],
  templateUrl: './not-found.html',
  styleUrl: './not-found.scss',
})
export class NotFound {}

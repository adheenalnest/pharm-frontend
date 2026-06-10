import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

interface Plan { id: string; label: string; mrp: number; price: number; tag?: string; }
interface FAQ  { q: string; a: string; open: boolean; }

@Component({
  selector: 'app-plus',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './plus.html',
  styleUrl: './plus.css',
})
export class PlusComponent {
  selectedPlan = '3months';
  couponOpen   = false;
  couponCode   = '';

  plans: Plan[] = [
    { id: '1month',   label: '1 Month',   mrp: 199,  price: 49  },
    { id: '3months',  label: '3 Months',  mrp: 499,  price: 99,  tag: 'BEST DEAL' },
    { id: '12months', label: '12 Months', mrp: 1499, price: 299 },
  ];

  get selected(): Plan { return this.plans.find(p => p.id === this.selectedPlan)!; }

  faqs: FAQ[] = [
    { q: 'What are the benefits of PharmEasy Plus?',                                                   a: 'Plus members get an extra 6% PharmEasy Credits on medicine & healthcare orders, along with free delivery on orders above Rs.499. Additionally, you get 20% PharmEasy Credits on all lab tests.', open: true },
    { q: 'Do the Plus PharmEasy Credits apply to healthcare products as well?',                        a: 'Yes, the 6% PharmEasy Credits are applicable on all medicine and healthcare product orders placed through PharmEasy.', open: false },
    { q: 'How long is my PharmEasy Plus membership valid for?',                                        a: 'Your membership is valid for the duration of the plan you choose — 1 Month, 3 Months, or 12 Months from the date of purchase.', open: false },
    { q: 'When will I get the PharmEasy Credits?',                                                     a: 'PharmEasy Credits are credited to your wallet within 24–48 hours of successful order delivery.', open: false },
    { q: 'What is the validity of the PharmEasy Credits?',                                             a: 'PharmEasy Credits are valid for 6 months from the date they are credited to your wallet.', open: false },
    { q: 'Is there a cap on the maximum PharmEasy Credits that can be used on medicine orders?',       a: 'Yes, you can use up to ₹200 worth of PharmEasy Credits per medicine order.', open: false },
    { q: 'Is there a cap on the maximum PharmEasy Credits that can be used on lab tests?',             a: 'Yes, you can use up to ₹500 worth of PharmEasy Credits per lab test order.', open: false },
    { q: 'Is there a cap on the maximum amount earned through the 6% PharmEasy Credits on medicine orders?', a: 'Yes, you can earn a maximum of ₹300 in PharmEasy Credits per medicine order through the Plus benefit.', open: false },
  ];

  toggleFaq(i: number): void { this.faqs[i].open = !this.faqs[i].open; }
}

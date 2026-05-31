"use client";

export function WorldMapBackground({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 1000 500"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* ── Amérique du Nord ── */}
      <path d="M 95 52 L 115 45 L 148 42 L 162 55 L 175 48 L 192 52 L 205 62 L 218 58
               L 232 68 L 238 82 L 248 90 L 252 105 L 245 118 L 255 128 L 258 142
               L 248 155 L 240 162 L 232 175 L 228 190 L 218 200 L 210 212 L 202 208
               L 195 198 L 185 195 L 175 202 L 168 212 L 162 205 L 155 195 L 148 188
               L 138 182 L 128 178 L 118 182 L 108 190 L 98 185 L 88 175 L 82 162
               L 75 148 L 72 132 L 68 118 L 72 105 L 78 92 L 85 78 L 90 65 Z"
        fill="rgba(34,197,94,0.04)" stroke="rgba(34,197,94,0.18)" strokeWidth="0.8" />

      {/* ── Amérique Centrale ── */}
      <path d="M 168 212 L 175 220 L 178 230 L 172 238 L 165 235 L 160 225 L 162 215 Z"
        fill="rgba(34,197,94,0.04)" stroke="rgba(34,197,94,0.15)" strokeWidth="0.7" />

      {/* ── Amérique du Sud ── */}
      <path d="M 172 240 L 185 238 L 200 242 L 218 248 L 232 255 L 242 268 L 248 282
               L 252 300 L 255 318 L 250 338 L 245 355 L 238 372 L 228 388 L 218 402
               L 208 415 L 198 422 L 188 418 L 178 408 L 168 395 L 158 378 L 152 360
               L 148 342 L 145 322 L 145 302 L 148 282 L 152 265 L 158 252 L 165 244 Z"
        fill="rgba(34,197,94,0.04)" stroke="rgba(34,197,94,0.18)" strokeWidth="0.8" />

      {/* ── Europe ── */}
      <path d="M 455 62 L 468 58 L 482 60 L 492 55 L 502 58 L 512 65 L 518 75
               L 522 88 L 515 98 L 508 105 L 498 108 L 488 112 L 478 118 L 468 115
               L 458 108 L 450 98 L 448 85 L 452 72 Z"
        fill="rgba(34,197,94,0.04)" stroke="rgba(34,197,94,0.15)" strokeWidth="0.7" />

      {/* ── Afrique ── (plus détaillée, c'est le continent mis en avant) */}
      <path d="M 452 122 L 468 118 L 485 115 L 502 112 L 518 115 L 532 120
               L 545 128 L 555 138 L 562 150 L 565 162 L 558 172 L 565 182
               L 568 195 L 562 208 L 555 220 L 548 232 L 542 245 L 545 258
               L 542 272 L 535 285 L 525 298 L 515 312 L 505 325 L 498 338
               L 492 352 L 488 365 L 485 378 L 482 390 L 478 400 L 472 408
               L 465 412 L 458 408 L 452 398 L 448 385 L 445 370 L 442 355
               L 440 340 L 438 322 L 435 305 L 432 288 L 428 272 L 428 255
               L 425 238 L 422 222 L 418 208 L 415 195 L 415 182 L 418 168
               L 422 155 L 428 145 L 435 135 L 442 128 Z"
        fill="rgba(34,197,94,0.06)" stroke="rgba(34,197,94,0.22)" strokeWidth="1" />

      {/* Corne de l'Afrique */}
      <path d="M 562 150 L 575 148 L 588 152 L 595 162 L 585 172 L 572 168 L 562 162 Z"
        fill="rgba(34,197,94,0.04)" stroke="rgba(34,197,94,0.15)" strokeWidth="0.7" />

      {/* ── Asie ── */}
      <path d="M 520 58 L 545 52 L 572 48 L 602 45 L 635 42 L 668 40 L 700 38
               L 732 40 L 762 45 L 788 52 L 808 60 L 822 72 L 828 85 L 822 98
               L 815 112 L 808 125 L 795 135 L 782 145 L 768 155 L 752 162
               L 738 168 L 722 172 L 705 178 L 688 182 L 672 185 L 655 188
               L 638 185 L 622 180 L 608 172 L 595 162 L 585 172 L 572 168
               L 562 162 L 558 172 L 552 180 L 542 185 L 535 178 L 528 168
               L 522 155 L 518 142 L 518 128 L 522 115 L 525 100 L 522 88
               L 520 75 L 520 62 Z"
        fill="rgba(34,197,94,0.04)" stroke="rgba(34,197,94,0.16)" strokeWidth="0.8" />

      {/* Péninsule Indienne */}
      <path d="M 638 185 L 645 198 L 650 215 L 648 232 L 642 248 L 632 258
               L 622 252 L 615 238 L 612 222 L 615 205 L 622 192 L 630 188 Z"
        fill="rgba(34,197,94,0.04)" stroke="rgba(34,197,94,0.15)" strokeWidth="0.7" />

      {/* Asie du Sud-Est */}
      <path d="M 752 162 L 768 168 L 782 178 L 792 192 L 788 208 L 778 218
               L 765 222 L 752 218 L 742 208 L 738 195 L 742 180 Z"
        fill="rgba(34,197,94,0.04)" stroke="rgba(34,197,94,0.14)" strokeWidth="0.7" />

      {/* ── Russie / Sibérie (simplifié) ── */}
      <path d="M 520 58 L 545 48 L 580 38 L 620 28 L 665 22 L 710 18 L 755 18
               L 800 22 L 840 28 L 872 35 L 895 42 L 910 52 L 905 65 L 888 72
               L 868 75 L 845 72 L 822 72 L 808 60 L 788 52 L 762 45 L 732 40
               L 700 38 L 668 40 L 635 42 L 602 45 L 572 48 L 545 52 Z"
        fill="rgba(34,197,94,0.03)" stroke="rgba(34,197,94,0.12)" strokeWidth="0.6" />

      {/* ── Australie ── */}
      <path d="M 788 298 L 808 292 L 828 290 L 848 292 L 865 298 L 878 310
               L 882 325 L 878 340 L 868 352 L 852 360 L 835 362 L 818 358
               L 802 348 L 792 335 L 785 320 L 785 308 Z"
        fill="rgba(34,197,94,0.04)" stroke="rgba(34,197,94,0.16)" strokeWidth="0.8" />

      {/* ── Groenland (petite masse) ── */}
      <path d="M 218 22 L 235 18 L 252 20 L 262 30 L 258 42 L 245 48 L 232 45
               L 220 38 L 215 28 Z"
        fill="rgba(34,197,94,0.03)" stroke="rgba(34,197,94,0.1)" strokeWidth="0.6" />

      {/* ── Japon (petites îles) ── */}
      <path d="M 842 88 L 850 85 L 858 90 L 855 100 L 845 102 L 838 96 Z"
        fill="rgba(34,197,94,0.04)" stroke="rgba(34,197,94,0.14)" strokeWidth="0.6" />
    </svg>
  );
}

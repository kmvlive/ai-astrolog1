<?php

namespace App\Mail;

use App\Models\MagazineIssue;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class MagazineReadyMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(public MagazineIssue $issue) {}

    public function envelope(): Envelope
    {
        $date = $this->issue->issue_date->translatedFormat('d.m.Y');
        return new Envelope(
            subject: "💌 Ваш журнал от {$date} готов",
        );
    }

    public function content(): Content
    {
        return new Content(view: 'emails.magazine-ready');
    }
}

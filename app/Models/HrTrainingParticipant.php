<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class HrTrainingParticipant extends Model
{
    protected $table = 'hr_training_participants';
    protected $fillable = [
        'training_id',
        'employee_id',
        'status',
        'certificate_number',
        'certificate_path',
        'notes'
    ];
}

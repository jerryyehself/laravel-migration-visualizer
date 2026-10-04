<?php
return new class extends Migration {
    function up(): void {
        Schema::create('attachments', function($t) {
            $t->id(); $t->string('path'); $t->numericMorphs('attachable');
        });
    }
};

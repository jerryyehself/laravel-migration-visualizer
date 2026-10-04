<?php
return new class extends Migration {
    function up(): void {
        Schema::table('attachments', function($t) {
            $t->dropMorphs('owner','owner_lookup');
        });
    }
};

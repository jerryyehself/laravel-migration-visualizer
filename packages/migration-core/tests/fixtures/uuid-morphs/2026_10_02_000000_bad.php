<?php return new class extends Migration { function up() { Schema::table('tags', function($t) { $t->uuidMorphs('taggable'); $t->dropColumn('missing'); }); } };

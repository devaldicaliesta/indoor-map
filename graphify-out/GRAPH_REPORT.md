# Graph Report - indoor-map  (2026-11-25)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 10063 nodes · 32535 edges · 312 communities (239 shown, 73 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 507 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `a0bf5725`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Community 0
- Community 1
- Community 2
- Community 3
- Community 4
- Community 5
- Community 6
- Community 7
- Community 8
- Community 9
- Community 10
- Community 11
- Community 12
- Community 13
- Community 14
- Community 15
- Community 16
- Community 17
- Community 18
- Community 19
- Community 20
- Community 21
- Community 22
- Community 23
- Community 24
- Community 25
- Community 26
- Community 27
- Community 28
- Community 29
- Community 30
- Community 31
- Community 32
- Community 33
- Community 34
- Community 35
- Community 36
- Community 37
- Community 38
- Community 39
- Community 40
- Community 41
- Community 42
- Community 43
- Community 44
- Community 45
- Community 46
- Community 47
- Community 48
- Community 49
- Community 50
- Community 51
- Community 52
- Community 53
- Community 54
- Community 55
- Community 56
- Community 57
- Community 58
- Community 59
- Community 60
- Community 61
- Community 62
- Community 63
- Community 64
- Community 65
- Community 66
- Community 67
- Community 68
- Community 69
- Community 70
- Community 71
- Community 72
- Community 73
- Community 74
- Community 75
- Community 76
- Community 77
- Community 78
- Community 79
- Community 80
- Community 81
- Community 82
- Community 83
- Community 84
- Community 85
- Community 86
- Community 87
- Community 88
- Community 89
- Community 90
- Community 91
- Community 92
- Community 93
- Community 94
- Community 95
- Community 96
- Community 97
- Community 98
- Community 99
- Community 100
- Community 101
- Community 102
- Community 103
- Community 104
- Community 105
- Community 106
- Community 107
- Community 108
- Community 109
- Community 110
- Community 111
- Community 112
- Community 113
- Community 114
- Community 115
- Community 116
- Community 117
- Community 118
- Community 119
- Community 120
- Community 121
- Community 122
- Community 123
- Community 124
- Community 125
- Community 126
- Community 127
- Community 128
- Community 129
- Community 130
- Community 131
- Community 132
- Community 133
- Community 134
- Community 135
- Community 136
- Community 137
- Community 138
- Community 139
- Community 140
- Community 141
- Community 142
- Community 143
- Community 144
- Community 145
- Community 146
- Community 147
- Community 148
- Community 149
- Community 150
- Community 151
- Community 152
- Community 153
- Community 154
- Community 155
- Community 156
- Community 157
- Community 158
- Community 159
- Community 160
- Community 161
- Community 162
- Community 163
- Community 164
- Community 165
- Community 166
- Community 167
- Community 168
- Community 169
- Community 170
- Community 171
- Community 172
- Community 173
- Community 174
- Community 175
- Community 176
- Community 177
- Community 178
- Community 179
- Community 180
- Community 181
- Community 182
- Community 183
- Community 184
- Community 185
- Community 186
- Community 187
- Community 188
- Community 189
- Community 190
- Community 191
- Community 192
- Community 193
- Community 194
- Community 195
- Community 196
- Community 197
- Community 198
- Community 199
- Community 200
- Community 201
- Community 202
- Community 203
- Community 204
- Community 205
- Community 206
- Community 207
- Community 208
- Community 209
- Community 210
- Community 211
- Community 212
- Community 213
- Community 214
- Community 215
- Community 216
- Community 217
- Community 218
- Community 219
- Community 220
- Community 221
- Community 222
- Community 223
- Community 224
- Community 225
- Community 226
- Community 227
- Community 228
- Community 229
- Community 230
- Community 231
- Community 232
- Community 233
- Community 234
- Community 235
- Community 236
- Community 237
- Community 238
- Community 239
- Community 240
- Community 241
- Community 243
- Community 244
- Community 245
- Community 246
- Community 247
- Community 248
- Community 249
- Community 250
- Community 252
- Community 253
- Community 254
- Community 255
- Community 256
- Community 257
- Community 258
- Community 260
- Community 274

## God Nodes (most connected - your core abstractions)
1. `Button()` - 350 edges
2. `VenueId` - 250 edges
3. `cn()` - 148 edges
4. `Input()` - 144 edges
5. `test` - 128 edges
6. `toDataError()` - 119 edges
7. `createRepositories()` - 115 edges
8. `FormNotice()` - 109 edges
9. `DialogHeader()` - 104 edges
10. `DialogTitle()` - 104 edges

## Surprising Connections (you probably didn't know these)
- `Attempt` --references--> `DataClient`  [EXTRACTED]
  e2e/support/role-attempts.ts → packages/data/src/client.ts
- `FloorTarget` --references--> `BuildingId`  [EXTRACTED]
  apps/admin/src/features/venues/floors/queries.ts → packages/domain/src/ids.ts
- `DemoRouteOptions` --references--> `Snapshot`  [EXTRACTED]
  apps/landing/src/demo/use-demo-route.ts → packages/domain/src/snapshot.ts
- `ClosureMarkData` --references--> `SnapshotPosition`  [EXTRACTED]
  apps/visitor/src/features/closures/closure-model.ts → packages/domain/src/snapshot.ts
- `Demo` --references--> `Venue`  [EXTRACTED]
  e2e/tests/visitor/verify/T-320-demo-venues.spec.ts → packages/domain/src/venue.ts

## Import Cycles
- None detected.

## Communities (312 total, 73 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.05
Nodes (159): Choice(), ColorField(), isColorValue(), Field(), fileSlug(), saveBlob(), AliasField(), FormNotice() (+151 more)

### Community 1 - "Community 1"
Cohesion: 0.03
Nodes (161): Can(), GRACE_READ_ONLY_HINT, useCan(), useLicenseReadOnly(), useRole(), useCurrentProfile(), DataTableGallery(), SURFACES (+153 more)

### Community 2 - "Community 2"
Cohesion: 0.03
Nodes (119): RFC-6238, createRepositories(), CompositeTypes, Constants, Database, DatabaseWithoutInternals, DefaultSchema, Enums (+111 more)

### Community 3 - "Community 3"
Cohesion: 0.02
Nodes (124): floors, gu, options, radiology, square, toilet, venueId, Draft (+116 more)

### Community 4 - "Community 4"
Cohesion: 0.03
Nodes (123): FormState, createAuthRepository(), signOut(), CODE_RULES, CodeRule, DataErrorKind, DEFAULT_MESSAGES, HTTP_RULES (+115 more)

### Community 5 - "Community 5"
Cohesion: 0.03
Nodes (128): chooseImage(), ACTION_LABELS, ImportDialog(), choose(), PLAN_COLUMNS, RESULT_FILTER, Summary(), readTable() (+120 more)

### Community 6 - "Community 6"
Cohesion: 0.04
Nodes (103): submit(), haversineM(), Geometry, SnapshotConnectorKind, SnapshotGraph, SnapshotPosition, ARC_ACCESSIBLE, ARC_CONNECTOR (+95 more)

### Community 7 - "Community 7"
Cohesion: 0.03
Nodes (30): Fixtures, FOOTPRINT, linkUnitsToPath(), PublishedVenue, test, TEST_CENTER, TestVenue, unitSquare() (+22 more)

### Community 8 - "Community 8"
Cohesion: 0.03
Nodes (101): currentProfileKey, useAuthSync(), RequireAuth(), data, initialAuthRedirectHash, useVenueSelection, venuesKey, aliasesKey() (+93 more)

### Community 9 - "Community 9"
Cohesion: 0.02
Nodes (89): page, vite-plugin-pwa@catalog:, diagnoseWriteRejection(), sql(), json(), read(), results, root (+81 more)

### Community 10 - "Community 10"
Cohesion: 0.04
Nodes (111): COLUMNS, date, DEMO_STATES, DemoState, FILTERS, FLOORS, NAMES, Room (+103 more)

### Community 11 - "Community 11"
Cohesion: 0.06
Nodes (92): others, TimezoneSelect(), VenuePicker(), AREA_KINDS, targetKey(), TargetPicker(), FloorFields(), FloorSelect() (+84 more)

### Community 12 - "Community 12"
Cohesion: 0.03
Nodes (51): VenueSelection, DataClient, DataClientConfig, AliasesRepository, AnalyticsConfig, AnalyticsRepository, DISABLED, ClosuresRepository (+43 more)

### Community 13 - "Community 13"
Cohesion: 0.06
Nodes (66): seedPublishHistory(), envFile, VENUES, CONTEXT, VENUES, ADDRESS, Collection, VENUES (+58 more)

### Community 14 - "Community 14"
Cohesion: 0.04
Nodes (91): Applicant, signedLicense(), paidLicense(), isEulaVersion(), needsEulaAcceptance(), canonicalize(), fromBase64(), importLicensePublicKey() (+83 more)

### Community 15 - "Community 15"
Cohesion: 0.05
Nodes (43): env, envFile, createHostedTrial(), endHostedTrial(), HostedTrialUser, removeHostedTrial(), currentLicenseId(), DEV_KEY (+35 more)

### Community 16 - "Community 16"
Cohesion: 0.04
Nodes (97): InsertedVenue, english(), locationDescription(), LocationPlace, Place, SnapshotIndex, OpeningHours, DisplayField (+89 more)

### Community 17 - "Community 17"
Cohesion: 0.04
Nodes (84): base, snapshot, facility, index, snapshot, at(), gzipBytes(), largeVenue() (+76 more)

### Community 18 - "Community 18"
Cohesion: 0.05
Nodes (71): BrandGallery(), Section(), AccountMenu(), AppLayout(), NarrowScreenNotice(), subscribe(), FeatureItem(), ItemBody() (+63 more)

### Community 19 - "Community 19"
Cohesion: 0.03
Nodes (51): floorId, API_COUNT_LABELS, AUDIT_LABELS, BULK_KINDS, describeAuditDetails(), describeDetails(), FAILURE_REASONS, LICENSE_SOURCES (+43 more)

### Community 20 - "Community 20"
Cohesion: 0.08
Nodes (76): GraphChangesInput, currentGraph(), GraphActions, useGraphActions(), OriginPointDraft, CONNECTOR_KINDS, CONNECTOR_NAME_MAX, ConnectorFloor (+68 more)

### Community 21 - "Community 21"
Cohesion: 0.03
Nodes (64): app.log_event(), audit_events_occurred_idx, public.audit_events, public.profiles, public.system_settings, app.guard_last_super_admin(), app.log_profile_changes(), profiles_guard_last_super_admin (+56 more)

### Community 22 - "Community 22"
Cohesion: 0.03
Nodes (70): BUILDINGS, FLOORS, g, venueId, submit(), BuildingRow, BuildingsRepository, codeConflict() (+62 more)

### Community 23 - "Community 23"
Cohesion: 0.05
Nodes (84): loadCrowd(), SnapshotNodeRole, areaSpots(), arrive(), between(), blankPerson(), buildNets(), createCrowd() (+76 more)

### Community 24 - "Community 24"
Cohesion: 0.04
Nodes (78): MapLabel, DEFAULT_FILL, DEFAULT_HEIGHTS, DEFAULT_OUTLINE, MAP_BACKGROUND, OUTDOOR_SUBTYPE_FILL, POINT_COLOR, POINT_STYLE (+70 more)

### Community 25 - "Community 25"
Cohesion: 0.04
Nodes (78): FeatureFieldset(), FormProblem(), fromQuotaDraft(), QUOTA_FIELDS, QuotaDraft, QuotaFieldset(), QuotaKey, REQUIRED (+70 more)

### Community 26 - "Community 26"
Cohesion: 0.07
Nodes (73): BottomSheet(), onClick(), onKeyDown(), onPointerDown(), onPointerMove(), onPointerUp(), cycleSnap(), FULL_TOP_GAP_PX (+65 more)

### Community 27 - "Community 27"
Cohesion: 0.05
Nodes (71): commit(), loadReference(), ReferenceLayer(), submit(), GeoreferenceMap(), Calibration(), GeoreferencePanel(), resize() (+63 more)

### Community 28 - "Community 28"
Cohesion: 0.05
Nodes (28): AdminShell, EditorPage, EditorTool, at(), drawUnit(), ring(), square(), unitsOn() (+20 more)

### Community 29 - "Community 29"
Cohesion: 0.05
Nodes (57): app.on_venue_created(), public.buildings, public.display_settings, public.floors, public.info_points, public.instruction_templates, public.origin_points, public.venues (+49 more)

### Community 30 - "Community 30"
Cohesion: 0.05
Nodes (63): ValidationOverlay(), FOCUS_MIN_ZOOM, focusFeature(), focusZoom(), geometryBounds(), Corners, areaFilter(), CLOSURE_COLOR (+55 more)

### Community 31 - "Community 31"
Cohesion: 0.06
Nodes (68): all, buildings, floorFeatures(), floors, MapPreview(), showFloor(), MapPreviewPage(), start (+60 more)

### Community 32 - "Community 32"
Cohesion: 0.07
Nodes (60): licenseFileName(), HOSTED_TRIAL_DAYS, content(), dateText(), dateTimeText(), NoticeDetails, NoticeEmail, renderAccountNotice() (+52 more)

### Community 33 - "Community 33"
Cohesion: 0.05
Nodes (65): boardsPdf(), floorFeatures(), KIND_LABELS_EN, languageOf(), locationStickerUrl(), mainLocations(), MAX_BOARD_LOCATIONS, stickersPdf() (+57 more)

### Community 34 - "Community 34"
Cohesion: 0.05
Nodes (66): BrandingFormErrors, BrandingFormValues, ColorNote, colorNotes(), MESSAGES, ratio, empty, toBrandingFormValues() (+58 more)

### Community 35 - "Community 35"
Cohesion: 0.04
Nodes (45): COORDINATE_DECIMALS, createFeatureEditor(), onClick(), drawStyles(), EditableFeature, editableFlags(), FeatureEditor, FeatureEditorCallbacks (+37 more)

### Community 36 - "Community 36"
Cohesion: 0.07
Nodes (43): app.check_unit_single_location(), app.release_units_on_permanent_close(), location_units_single_location, locations_release_units, public.categories, public.facility_types, public.features, public.field_definitions (+35 more)

### Community 37 - "Community 37"
Cohesion: 0.06
Nodes (50): DataError, geometryFromColumn(), geometryToColumn(), nullableGeometryFromColumn(), positionFromColumn(), fetchAllPages(), fetchOne(), mapBuildingRow() (+42 more)

### Community 38 - "Community 38"
Cohesion: 0.06
Nodes (48): TestRouteState, DemoOrigin, demoOrigin(), demoRoute(), destinationGroups(), routeFloorIds(), routeViewOn(), shownFloorOf() (+40 more)

### Community 39 - "Community 39"
Cohesion: 0.06
Nodes (55): BasemapUrlProblem, escapeAttribution(), LOCAL_HOSTS, ParsedUrl, applyEntitlements(), enabledFeatures(), FEATURE_LABELS, PAID_FEATURES (+47 more)

### Community 40 - "Community 40"
Cohesion: 0.05
Nodes (54): BPM, Copy, COPY, EN, ID, SCENES, assets, drawScene() (+46 more)

### Community 41 - "Community 41"
Cohesion: 0.06
Nodes (58): BUILDING_SIZES, BUILDING_TYPES, CSV_LABELS, date, dateTime, formatDate(), REJECT_REASONS, STAGES (+50 more)

### Community 42 - "Community 42"
Cohesion: 0.05
Nodes (47): Tables, zeroRowsError(), CategoryRow, createCategoriesRepository(), removeFile(), saveError(), uploadIcon(), isUpload() (+39 more)

### Community 43 - "Community 43"
Cohesion: 0.04
Nodes (52): connector(), connectors, edge(), edges, ENTRANCES, escalatorDown, escalatorUp, FLOORS (+44 more)

### Community 44 - "Community 44"
Cohesion: 0.06
Nodes (52): count, GROUP_LABELS, GroupSection(), ItemList(), KIND_LABELS, passwordKey, settingsKey, useSaveSystemSettings() (+44 more)

### Community 45 - "Community 45"
Cohesion: 0.06
Nodes (35): ACCOUNTS, LoginPage, InvitedUser, inviteUser(), Mail, MailpitDetail, MailpitSummary, search() (+27 more)

### Community 46 - "Community 46"
Cohesion: 0.07
Nodes (47): useNow(), capitalize(), closureText(), connectorNames(), FailedPlan, FailureContext, FailureText, failureText() (+39 more)

### Community 47 - "Community 47"
Cohesion: 0.04
Nodes (38): public.installation, public.licenses, app.license_active(), public.license_install(), public.license_status(), app.clock_rolled_back(), app.license_active(), app.license_tick() (+30 more)

### Community 48 - "Community 48"
Cohesion: 0.06
Nodes (52): EulaChoice, InstanceId(), ManualForm(), OnlineForm(), STATE_NOTICE, TrialForm(), Banner(), CheckinNotice() (+44 more)

### Community 49 - "Community 49"
Cohesion: 0.08
Nodes (48): ClosureForm(), NO_CLOSURES, ClosurePlaces, fromVenueInput(), impactText(), offsetMs(), targetLabel(), places (+40 more)

### Community 50 - "Community 50"
Cohesion: 0.07
Nodes (46): GraphLayer(), graphSnapFeatures(), graphViews(), neighbourPositions(), NO_STATUS, createGraphInteractions(), onMove(), onUp() (+38 more)

### Community 51 - "Community 51"
Cohesion: 0.05
Nodes (27): ACCOUNT_INACTIVE_MESSAGE, AUTH_EVENTS, authError(), AuthErrorCode, AuthErrorLike, AuthEvent, AuthRepository, EMAIL_UNAVAILABLE_PREFIXES (+19 more)

### Community 52 - "Community 52"
Cohesion: 0.09
Nodes (47): EntityIcon(), ListRow(), FacilityDetail(), Missing(), UnitDetail(), FieldValue(), LocationProfile(), Places() (+39 more)

### Community 53 - "Community 53"
Cohesion: 0.07
Nodes (43): VenueSpec, ENTRIES, Entry, HAYSTACKS, info(), isPictogramKey(), KEY_SET, PICTOGRAM_CATEGORY_LABELS (+35 more)

### Community 54 - "Community 54"
Cohesion: 0.06
Nodes (43): svgToPng(), usePickedFile(), pick(), renderPdfPage(), selectPage(), loadPdfJs(), openPdf(), PdfDocument (+35 more)

### Community 55 - "Community 55"
Cohesion: 0.06
Nodes (49): autoStills(), frozenRuns(), audio, build, { chromium }, clips, decode(), encoded (+41 more)

### Community 56 - "Community 56"
Cohesion: 0.09
Nodes (37): public.hosting_queue_next(), hosting.vendor_actions, public.vendor_clients(), public.vendor_installations(), vendor.checkins, vendor.clients, vendor.installations, vendor.licenses (+29 more)

### Community 57 - "Community 57"
Cohesion: 0.06
Nodes (47): root, API_SCOPE_LABELS, API_SCOPES, API_UPSERT_MAX, ApiClosureInput, ApiHoursRow, ApiLocationUpsert, ApiParse (+39 more)

### Community 58 - "Community 58"
Cohesion: 0.07
Nodes (40): app.api_key_check(), app.api_spans(), app.check_venue_list(), app.check_webhook_input(), app.webhook_emit(), app.webhook_flush(), app.webhook_location_touched(), app.webhook_on_location() (+32 more)

### Community 59 - "Community 59"
Cohesion: 0.09
Nodes (46): floorLabel(), InfoPointDialog(), InfoPointDialogTarget, InfoPointForm(), submit(), Places, PROBLEMS, InfoPointsPanel() (+38 more)

### Community 60 - "Community 60"
Cohesion: 0.07
Nodes (39): RFC-2045, RFC-2387, accepted(), claim(), logError(), NoticeRow, release(), text() (+31 more)

### Community 61 - "Community 61"
Cohesion: 0.06
Nodes (38): hosting.trials, app.can_write_floor(), app.can_write_location(), app.can_write_location_type(), app.reject_locked_venue(), app.venue_locked(), app.writable_venue_ids(), edit_locks_trial_lock (+30 more)

### Community 62 - "Community 62"
Cohesion: 0.09
Nodes (45): CLOSE_BUTTON, OPTION_LIFT_A, SAVE_BUTTON, SELECT_BOX, EDITOR_CAM, PUBLISH_BUTTON, unitCorner(), VALIDATE_BUTTON (+37 more)

### Community 63 - "Community 63"
Cohesion: 0.05
Nodes (49): react-dom@catalog:, react-dom, @types/react-dom, @types/react-dom@catalog:, @types/react-dom@catalog:, react-dom@catalog:, @types/react-dom@catalog:, dependencies (+41 more)

### Community 64 - "Community 64"
Cohesion: 0.08
Nodes (38): ClosureDialog(), useClosureDialog, Editor(), footprintCenter(), useActivePlan(), useFloorSelection(), useStepFloor(), LockBanner() (+30 more)

### Community 65 - "Community 65"
Cohesion: 0.06
Nodes (45): IMDF_ACCESS_CONTROL, IMDF_ACCESSIBILITY, IMDF_AMENITY_CATEGORIES, IMDF_BUILDING_CATEGORIES, IMDF_FOOTPRINT_CATEGORIES, IMDF_LEVEL_CATEGORIES, IMDF_OCCUPANT_CATEGORIES, IMDF_OPENING_CATEGORIES (+37 more)

### Community 66 - "Community 66"
Cohesion: 0.09
Nodes (38): drawKindLabel(), drawKindValue(), OUTDOOR_SUBTYPE_LABELS, UNIT_STATUS_LABELS, KindPicker(), choose(), createForUnit(), editorQueues() (+30 more)

### Community 67 - "Community 67"
Cohesion: 0.07
Nodes (21): appServers, args, CI, projectArgs, capture(), shot(), PATHS, @axe-core/playwright (+13 more)

### Community 68 - "Community 68"
Cohesion: 0.06
Nodes (38): createMediaRepository(), list(), IMAGE_EXTENSIONS, isBucket(), mapMediaRow(), MediaRepository, MediaRow, usagesOf() (+30 more)

### Community 69 - "Community 69"
Cohesion: 0.12
Nodes (36): failure, useMapAvailable(), OriginChooser(), OriginRow(), OriginTapHint(), useOriginName(), AddStop(), targetOfHit() (+28 more)

### Community 70 - "Community 70"
Cohesion: 0.06
Nodes (27): CadConverterRepository, CadLayer, CadRender, createCadConverterRepository(), post(), DXF, Messages, SCAN (+19 more)

### Community 71 - "Community 71"
Cohesion: 0.06
Nodes (36): app.check_edge_same_floor(), app.touch_updated_at(), app.user_role(), closures_venue_period_idx, display_settings_touch_updated_at, features_floor_idx, features_geom_idx, features_unit_code_unique (+28 more)

### Community 72 - "Community 72"
Cohesion: 0.07
Nodes (16): DataTablePage, drawPlan(), multiPagePdf(), openGallery(), capture(), shot(), capture(), shot() (+8 more)

### Community 73 - "Community 73"
Cohesion: 0.12
Nodes (34): PanelMessage(), useMediaQuery(), Brand(), DESKTOP_QUERY, Logo(), MapArea(), MOBILE_HEADER_PX, VisitorShell() (+26 more)

### Community 74 - "Community 74"
Cohesion: 0.06
Nodes (18): SheetSnap, createExploreStore(), ExploreState, FocusMode, INITIAL, InitialExplore, initialState(), listKey() (+10 more)

### Community 75 - "Community 75"
Cohesion: 0.12
Nodes (37): newLicenseId(), onPremTrialIssueRequest(), trialApprovalDaysProblem(), InviteInput, inviteScope(), Role, ROLES, activeSuperAdmin() (+29 more)

### Community 76 - "Community 76"
Cohesion: 0.08
Nodes (28): InstructionErrors, previewInstruction(), SAMPLE, SAMPLE_FLOOR, validateInstruction(), FILTERS, LANGUAGE_LABELS, placeholders() (+20 more)

### Community 77 - "Community 77"
Cohesion: 0.06
Nodes (27): public.edit_locks, public.publications, publications_one_active, public.publish_abort(), public.publish_begin(), public.publish_commit(), app.floor_writable(), public.acquire_edit_lock() (+19 more)

### Community 78 - "Community 78"
Cohesion: 0.05
Nodes (43): catalog, @axe-core/playwright, @biomejs/biome, class-variance-authority, clsx, driver.js, i18next, lucide-react (+35 more)

### Community 79 - "Community 79"
Cohesion: 0.09
Nodes (33): count, GraphLegend(), ITEMS, LegendStyle, Swatch(), VisibilityToggle(), CLOSURE_REFRESH_MS, useCurrentClosures() (+25 more)

### Community 80 - "Community 80"
Cohesion: 0.08
Nodes (25): EditorPatch, EditorState, EMPTY_GRAPH, GRAPH_SHOWN, GRAPH_TOOLS, IDLE, isEmpty(), SaveSource (+17 more)

### Community 81 - "Community 81"
Cohesion: 0.05
Nodes (42): source, assist, actions, enabled, css, parser, files, ignoreUnknown (+34 more)

### Community 82 - "Community 82"
Cohesion: 0.06
Nodes (41): zustand@catalog:, tailwindcss@catalog:, @tailwindcss/vite@catalog:, tailwindcss, @tailwindcss/vite, zustand, tailwindcss@catalog:, @tailwindcss/vite@catalog: (+33 more)

### Community 83 - "Community 83"
Cohesion: 0.08
Nodes (31): EntranceField(), EntranceState, IDLE, useEntranceStore, EntrancesPanel(), suggest(), FeatureButton(), meters (+23 more)

### Community 84 - "Community 84"
Cohesion: 0.08
Nodes (36): FloorValidation, useFloorValidation(), MultiPolygon, areaFormat, Boundary, BOUNDARY_TOLERANCE_M, Checked, duplicateCodeIssues() (+28 more)

### Community 85 - "Community 85"
Cohesion: 0.10
Nodes (32): graphQuery(), loadSnapshot(), loadSnapshotWithGraph(), snapshotKey(), useRouteSnapshot(), useSnapshot(), Prefetch, PrefetchHolder (+24 more)

### Community 86 - "Community 86"
Cohesion: 0.14
Nodes (31): ExportResult, ImdfAddressDraft, ImdfAddressProblem, IMDF_VERSION, ImdfAddress, ImdfExport, ImdfExportInput, isPolygonal() (+23 more)

### Community 87 - "Community 87"
Cohesion: 0.06
Nodes (39): dependencies, fflate@^0.8.3, @indoor/data@workspace:*, @indoor/domain@workspace:*, react@catalog:, react-router@catalog:, devDependencies, @biomejs/biome@catalog: (+31 more)

### Community 88 - "Community 88"
Cohesion: 0.20
Nodes (35): ContrastTable(), readToken(), PreviewTable(), BackupHistory(), formatDateTime(), CheckinsDialog(), History(), ClientsPanel() (+27 more)

### Community 89 - "Community 89"
Cohesion: 0.11
Nodes (32): copy(), Certificate(), Disks(), LastBackup(), Row(), Services(), alertText(), date (+24 more)

### Community 90 - "Community 90"
Cohesion: 0.11
Nodes (34): RouteGraphStatus, ExploreContext, ExploreData, ExploreProvider(), loadSearch(), NO_STOPS, getCachedSearchIndex(), openDB() (+26 more)

### Community 91 - "Community 91"
Cohesion: 0.13
Nodes (30): data, EventDetail(), EventList(), EventRow(), KindBadge(), LiveBadge(), LocationEvents(), Section() (+22 more)

### Community 92 - "Community 92"
Cohesion: 0.08
Nodes (21): globalSetup(), SERVER_ATTEMPTS, input(), PATHS, PNG, seedLocations(), signedIn(), as() (+13 more)

### Community 93 - "Community 93"
Cohesion: 0.08
Nodes (21): app.hook_password_verification_attempt(), app.log_settings_changed(), public.set_smtp_password(), public.smtp_password_for_sending(), public.smtp_password_is_set(), system_settings_log_changes, app.hook_password_verification_attempt(), app.request_account_notice() (+13 more)

### Community 94 - "Community 94"
Cohesion: 0.10
Nodes (25): createDeviceTourStore(), deviceTourStore, SEEN_STORAGE_KEY, ensureStyle(), findTourTarget(), reducedMotion(), runTour(), TourEnd (+17 more)

### Community 95 - "Community 95"
Cohesion: 0.11
Nodes (29): PrivacyNotice(), PrivacyToggle(), ANALYTICS_FLUSH_MS, ANALYTICS_FLUSH_SIZE, AnalyticsQueue, choice, choosePrivacy(), listeners (+21 more)

### Community 96 - "Community 96"
Cohesion: 0.06
Nodes (36): defaults, name, runs-on, steps, timeout-minutes, runs-on, steps, timeout-minutes (+28 more)

### Community 97 - "Community 97"
Cohesion: 0.06
Nodes (36): concurrency, cancel-in-progress, group, name, runs-on, steps, name, runs-on (+28 more)

### Community 98 - "Community 98"
Cohesion: 0.06
Nodes (35): @types/node, bin, license-cli, devDependencies, @biomejs/biome@catalog:, @types/node@catalog:, typescript@catalog:, vitest@catalog: (+27 more)

### Community 99 - "Community 99"
Cohesion: 0.06
Nodes (35): @indoor/map-core@workspace:*, lucide-react@catalog:, @indoor/map-core, lucide-react, dependencies, @indoor/domain@workspace:*, @indoor/map-core@workspace:*, @indoor/routing@workspace:* (+27 more)

### Community 100 - "Community 100"
Cohesion: 0.06
Nodes (35): @indoor/ui@workspace:*, @tanstack/react-query@catalog:, @indoor/ui, @tanstack/react-query, @indoor/ui@workspace:*, dependencies, @indoor/data@workspace:*, @indoor/domain@workspace:* (+27 more)

### Community 101 - "Community 101"
Cohesion: 0.11
Nodes (29): iconSpecs(), categoryIconSpecs(), facilityIconSpecs(), parseFacilityIcon(), canvas2d(), categoryIconTypeId(), drawBadge(), drawGlyph() (+21 more)

### Community 102 - "Community 102"
Cohesion: 0.21
Nodes (34): ClosureState, DIALOG, dialog(), drawClosures(), table(), drawEditor(), featurePanel(), propertiesPanel() (+26 more)

### Community 103 - "Community 103"
Cohesion: 0.08
Nodes (23): NON_RETRYABLE, queryClient, useVisitorTour(), LanguagePicker(), infoPointTour(), ShowSheet, venueTour(), useExplorerTour() (+15 more)

### Community 104 - "Community 104"
Cohesion: 0.11
Nodes (28): eventPositions(), Placed, useEventMap(), RouteAction(), featureName(), featurePosition(), featureView(), OriginView (+20 more)

### Community 105 - "Community 105"
Cohesion: 0.15
Nodes (29): IssueSeverity, geometryFindings(), instructionFindings(), isEmptyValue(), locationFindings(), planFindings(), byFloor(), finding() (+21 more)

### Community 106 - "Community 106"
Cohesion: 0.10
Nodes (28): requestTrial(), en, id, TRIAL_COPY, TrialCopy, Field(), Problems, State (+20 more)

### Community 107 - "Community 107"
Cohesion: 0.09
Nodes (16): ContrastFailure, contrastFailures(), CheckResult, escapeHtml(), readJson(), readRepo(), renderSummary(), repoRoot (+8 more)

### Community 108 - "Community 108"
Cohesion: 0.07
Nodes (32): devDependencies, @biomejs/biome@catalog:, supabase@catalog:, turbo@catalog:, @types/node@catalog:, typescript@catalog:, vitest@catalog:, engines (+24 more)

### Community 109 - "Community 109"
Cohesion: 0.15
Nodes (30): canvasArea(), connectorColor(), drawPlan(), strokeRoute(), deskAndMonitor(), LOBBY, lobby(), screenQuad() (+22 more)

### Community 110 - "Community 110"
Cohesion: 0.15
Nodes (27): count, fallbackLabel(), FeatureList(), onSearchKey(), GroupRow(), ItemRow(), buildRows(), collator (+19 more)

### Community 111 - "Community 111"
Cohesion: 0.11
Nodes (24): snapshot, VenueBrand, venueBrand(), brandDisplayName(), appliedColors, feature(), FLOW_DASHES, flows (+16 more)

### Community 112 - "Community 112"
Cohesion: 0.11
Nodes (21): areaM2(), polygonAreaM2(), ringAreaM2(), roundAreaM2(), LinearRingSchema, LineStringSchema, MultiPolygonSchema, PointSchema (+13 more)

### Community 113 - "Community 113"
Cohesion: 0.10
Nodes (24): collection(), ExportFeature, ExportFeatureCollection, ExportGeometry, GEOJSON_EXPORT_FORMAT, GEOJSON_EXPORT_VERSION, graphFeatures(), locationFeatures() (+16 more)

### Community 114 - "Community 114"
Cohesion: 0.06
Nodes (30): fixture_audit_events, fixture_buildings, fixture_categories, fixture_closures, fixture_connector_stops, fixture_connectors, fixture_display_settings, fixture_edit_locks (+22 more)

### Community 115 - "Community 115"
Cohesion: 0.10
Nodes (27): box(), C, canvas, caption(), clamp(), ctx, drawLogo(), DURATION_MS (+19 more)

### Community 116 - "Community 116"
Cohesion: 0.15
Nodes (21): App(), Gate, gateKey, readGate(), AuthShell(), errorText(), FormNotice(), LoginForm() (+13 more)

### Community 117 - "Community 117"
Cohesion: 0.13
Nodes (27): TRIAL_FEATURES, TRIAL_MIN_DAYS, checkOnPremTrialRequest(), ONPREM_TRIAL_DEFAULT_DAYS, ONPREM_TRIAL_STATUSES, OnPremTrialCheck, onPremTrialRefusal(), OnPremTrialRequest (+19 more)

### Community 118 - "Community 118"
Cohesion: 0.12
Nodes (23): parseModelRef(), three@catalog:, createModelsLayer(), rebuild(), report(), placeModels(), libraryModel(), loadThreeLayer() (+15 more)

### Community 119 - "Community 119"
Cohesion: 0.15
Nodes (25): OUTDOOR, usePublicVisitorUrl(), ChangeSummary(), ActiveVersion(), kilobytes(), PublishButton(), VenuePublish(), activePublicationKey() (+17 more)

### Community 120 - "Community 120"
Cohesion: 0.13
Nodes (25): EditorState, TOOLS, Connector, CONNECTORS, CORRIDORS, DESTINATION, DESTINATION_UNIT, FLOOR_D (+17 more)

### Community 121 - "Community 121"
Cohesion: 0.18
Nodes (22): LandingPage(), useLanguage(), Contact(), BUILDING_ICONS, Buildings(), FEATURE_ICONS, Features(), Hero() (+14 more)

### Community 122 - "Community 122"
Cohesion: 0.13
Nodes (26): addYear(), EVENT_LIMITS, EVENT_PHASE_LABELS, EVENT_REPEATS, EVENT_SOON_DAYS, EVENT_STATUS_LABELS, EVENT_STATUSES, EventInputErrors (+18 more)

### Community 123 - "Community 123"
Cohesion: 0.13
Nodes (23): BuildingType, slugFromName(), TRIAL_SAMPLE_LIMITS, TRIAL_TEMPLATES, trialSample(), TrialSampleLimits, hoursRows(), point() (+15 more)

### Community 124 - "Community 124"
Cohesion: 0.07
Nodes (28): environment, API_EXTERNAL_URL, GOTRUE_API_HOST, GOTRUE_API_PORT, GOTRUE_DB_DATABASE_URL, GOTRUE_DB_DRIVER, GOTRUE_DISABLE_SIGNUP, GOTRUE_EXTERNAL_EMAIL_ENABLED (+20 more)

### Community 125 - "Community 125"
Cohesion: 0.08
Nodes (27): @indoor/domain, dependencies, @indoor/domain@workspace:*, @supabase/supabase-js@catalog:, devDependencies, @biomejs/biome@catalog:, @types/node@catalog:, typescript@catalog: (+19 more)

### Community 126 - "Community 126"
Cohesion: 0.09
Nodes (26): pdfjs-dist@catalog:, @indoor/data@workspace:*, devDependencies, @biomejs/biome@catalog:, fflate@^0.8.3, @indoor/data@workspace:*, @indoor/domain@workspace:*, pdfjs-dist@catalog: (+18 more)

### Community 127 - "Community 127"
Cohesion: 0.12
Nodes (20): confidenceLevel(), isPositive(), pixelToLngLat(), PlanCorners, readObject(), readScanResult(), SCAN_CONFIDENCE_LABELS, SCAN_MIN_ROOM_M2 (+12 more)

### Community 128 - "Community 128"
Cohesion: 0.13
Nodes (7): ConversionError, _extents(), inspect_dxf(), Inspection, is_dwg(), _read(), InspectTest

### Community 129 - "Community 129"
Cohesion: 0.24
Nodes (18): axis_walls(), close_doors(), Deadline, decode(), diagonal_walls(), drop_small(), find_rooms(), find_walls() (+10 more)

### Community 130 - "Community 130"
Cohesion: 0.18
Nodes (24): roomGeometry(), checkPolygon(), Box, boxesOverlap(), boxOf(), clipConvex(), cross(), dot() (+16 more)

### Community 131 - "Community 131"
Cohesion: 0.13
Nodes (21): cert_json(), clean(), disk_json(), disks_json(), services_json(), health-report.sh script, ask(), assert_env_version() (+13 more)

### Community 132 - "Community 132"
Cohesion: 0.08
Nodes (25): @biomejs/biome, devDependencies, @biomejs/biome@catalog:, typescript@catalog:, vitest@catalog:, exports, ./export, ./fixtures/* (+17 more)

### Community 133 - "Community 133"
Cohesion: 0.11
Nodes (24): ANALYTICS_DEVICES, ANALYTICS_ORIGIN_KINDS, ANALYTICS_QUERY_MAX, ANALYTICS_RETENTION_DAYS, ANALYTICS_SOURCES, ANALYTICS_TARGET_KINDS, AnalyticsContext, analyticsCsv() (+16 more)

### Community 134 - "Community 134"
Cohesion: 0.14
Nodes (15): alignmentPositions(), BLOCKS, dataBytes(), dataCodewords(), divisor(), ECC_PER_BLOCK, encodeQr(), Grid (+7 more)

### Community 135 - "Community 135"
Cohesion: 0.17
Nodes (22): at(), CATEGORY_ID, DENSE_FLOOR, FACILITY_TYPE_ID, floorFeatures(), FloorGraph, floorGraph(), floorName() (+14 more)

### Community 136 - "Community 136"
Cohesion: 0.09
Nodes (24): @indoor/routing@workspace:*, @indoor/routing, @indoor/routing@workspace:*, devDependencies, @biomejs/biome@catalog:, @indoor/domain@workspace:*, @indoor/routing@workspace:*, @supabase/supabase-js@catalog: (+16 more)

### Community 137 - "Community 137"
Cohesion: 0.16
Nodes (19): downloadCsvTemplate(), downloadXlsxTemplate(), save(), slug(), columnIndex(), columnName(), escapeXml(), firstSheetPath() (+11 more)

### Community 138 - "Community 138"
Cohesion: 0.15
Nodes (21): buildingCam(), buildingMarkers(), BuildingOpts, buildingRoute(), drawBuilding(), FLOOR_GAP, FLOORS, floorZ() (+13 more)

### Community 139 - "Community 139"
Cohesion: 0.08
Nodes (23): concurrency, cancel-in-progress, group, GH_TOKEN, jobs, release, name, on (+15 more)

### Community 140 - "Community 140"
Cohesion: 0.12
Nodes (18): applyGraphPatch(), edgeLengthM(), apply(), BASE, degree(), draw(), edgeList(), EMPTY (+10 more)

### Community 141 - "Community 141"
Cohesion: 0.14
Nodes (21): Dashboard(), number, Range, RANGES, Ranked(), save(), SECTIONS, shiftDay() (+13 more)

### Community 142 - "Community 142"
Cohesion: 0.12
Nodes (5): main(), supabase_access_check(), call(), check(), AccessCheckTest

### Community 143 - "Community 143"
Cohesion: 0.10
Nodes (22): @types/geojson@catalog:, @types/geojson, devDependencies, @biomejs/biome@catalog:, @types/geojson@catalog:, @types/three@catalog:, typescript@catalog:, vitest@catalog: (+14 more)

### Community 144 - "Community 144"
Cohesion: 0.13
Nodes (18): FIELD_PROBLEM_MESSAGES, FIELD_TYPE_LABELS, useTypeChoice(), change(), lostOnChange(), CustomField, CustomFieldProblem, customFieldsSchema() (+10 more)

### Community 145 - "Community 145"
Cohesion: 0.18
Nodes (20): distanceM(), CONNECTOR_ACTIONS, connectorSteps(), INSTRUCTION_PLACEHOLDERS, InstructionPlaceholder, pointStep(), routeSteps(), StepFloor (+12 more)

### Community 146 - "Community 146"
Cohesion: 0.09
Nodes (21): agentGuidance, dependsOn, outputs, cache, persistent, cache, $schema, tasks (+13 more)

### Community 147 - "Community 147"
Cohesion: 0.17
Nodes (19): DeliveriesPanel(), isStatus(), TONES, deliveriesKey, keysKey, root, useCreateApiKey(), useCreateWebhook() (+11 more)

### Community 148 - "Community 148"
Cohesion: 0.16
Nodes (14): Copy, COPY, en, id, Language, initialLanguage(), LanguageContext, LanguageProvider() (+6 more)

### Community 149 - "Community 149"
Cohesion: 0.10
Nodes (20): concurrency, cancel-in-progress, group, jobs, update, name, on, push (+12 more)

### Community 150 - "Community 150"
Cohesion: 0.13
Nodes (17): FIXTURE, generate(), subjectSetup(), target, USERS, VENUE, ACCESS_SUBJECTS, AccessSubject (+9 more)

### Community 151 - "Community 151"
Cohesion: 0.16
Nodes (7): bbox(), iou(), load(), matched(), png(), ScanFixtureTest, ScanLimitTest

### Community 152 - "Community 152"
Cohesion: 0.18
Nodes (16): A4, analyticsPdf(), fixed(), Line, lines(), pages(), A6_PT, contentStream() (+8 more)

### Community 153 - "Community 153"
Cohesion: 0.15
Nodes (15): failed(), keys, useReleases(), checkCheckinRequest(), CheckinCheck, CheckinRequest, checkNewRelease(), InstallationReleaseState (+7 more)

### Community 154 - "Community 154"
Cohesion: 0.25
Nodes (19): bench(), box(), BUILDERS, busStop(), COLORS, cylinder(), elevator(), escalator() (+11 more)

### Community 155 - "Community 155"
Cohesion: 0.19
Nodes (7): SaveState, SaveOp, SaveQueue, SaveQueueOptions, SaveStatus, deferred(), setup()

### Community 156 - "Community 156"
Cohesion: 0.13
Nodes (13): FALLBACK_CENTER, FootprintMap(), dependencies, @indoor/domain@workspace:*, maplibre-gl@catalog:, terra-draw@catalog:, terra-draw-maplibre-gl-adapter@catalog:, EDIT_COLORS (+5 more)

### Community 157 - "Community 157"
Cohesion: 0.14
Nodes (12): ICONS, K, scene6, CATEGORY, closureHatch(), mix(), paperGrid(), paths (+4 more)

### Community 158 - "Community 158"
Cohesion: 0.19
Nodes (17): archive_package(), assemble_package(), assert_image_key(), build_images(), check_package(), collect_licenses(), copy_from_image(), export_source() (+9 more)

### Community 159 - "Community 159"
Cohesion: 0.18
Nodes (15): db_psql(), dc(), die(), fetch_images(), health_check(), health_once(), install_schedules(), load_env() (+7 more)

### Community 160 - "Community 160"
Cohesion: 0.22
Nodes (4): render_svg(), sample_dxf(), RenderTest, ServerTest

### Community 161 - "Community 161"
Cohesion: 0.12
Nodes (18): devDependencies, @biomejs/biome@catalog:, @types/node@catalog:, typescript@catalog:, vite@catalog:, vitest@catalog:, exports, vite (+10 more)

### Community 162 - "Community 162"
Cohesion: 0.13
Nodes (16): saveValid(), { chromium }, envFile, locationId(), OUT, require, rest(), root (+8 more)

### Community 163 - "Community 163"
Cohesion: 0.20
Nodes (15): LicenseDialog(), LicensePanel(), RevokeConfirm(), STATUS, todayInJakarta(), TrialRequestsPanel(), downloadLicense(), failed() (+7 more)

### Community 164 - "Community 164"
Cohesion: 0.11
Nodes (18): condition, auth, storage, ADMIN_URL, FUNCTIONS_URL, PGDATABASE, PGHOST, PGPASSWORD (+10 more)

### Community 165 - "Community 165"
Cohesion: 0.12
Nodes (17): typescript, dependencies, devDependencies, @biomejs/biome@catalog:, typescript@catalog:, vitest@catalog:, exports, vitest (+9 more)

### Community 166 - "Community 166"
Cohesion: 0.11
Nodes (18): compilerOptions, allowImportingTsExtensions, exactOptionalPropertyTypes, forceConsistentCasingInFileNames, isolatedModules, lib, module, moduleDetection (+10 more)

### Community 167 - "Community 167"
Cohesion: 0.24
Nodes (13): home(), LanguageSwitch(), MobileMenu(), privacyPage(), SiteFooter(), SiteHeader(), PrivacyPage(), apply() (+5 more)

### Community 168 - "Community 168"
Cohesion: 0.12
Nodes (16): KEY, URL, jobs, ping, name, on, schedule, workflow_dispatch (+8 more)

### Community 169 - "Community 169"
Cohesion: 0.12
Nodes (16): aliases, components, hooks, lib, ui, utils, iconLibrary, rsc (+8 more)

### Community 170 - "Community 170"
Cohesion: 0.16
Nodes (11): BrandMarkProps, Part, SYMBOL_PARTS, LOGO_HEIGHT, LOGO_WIDTH, SYMBOL_BLUE, SYMBOL_WIDTH, SYMBOL_YELLOW (+3 more)

### Community 171 - "Community 171"
Cohesion: 0.15
Nodes (10): ScanState, LineString, ScanCandidate, ScanConfidenceLevel, removePreview(), SCAN_LEVEL_COLORS, SCAN_PREVIEW_LAYER_IDS, ScanPreview (+2 more)

### Community 172 - "Community 172"
Cohesion: 0.21
Nodes (14): useDocumentMeta(), OUTCOMES, pending, postVerify(), RequestResult, retryVerify(), VerifyResult, verifyTrial() (+6 more)

### Community 173 - "Community 173"
Cohesion: 0.16
Nodes (16): image, logging, restart, logging, driver, options, max-file, max-size (+8 more)

### Community 174 - "Community 174"
Cohesion: 0.21
Nodes (8): contrastOn(), enableAutoTours(), luminance(), resetTourProgress(), TourPopover, tourProgress(), openVenue(), PHONE_EN

### Community 175 - "Community 175"
Cohesion: 0.12
Nodes (3): LicenseRepository, LicenseLimits, QuotaUsage

### Community 176 - "Community 176"
Cohesion: 0.15
Nodes (7): EventSave, base(), playlist(), PNG, setUp(), slide(), EventInput

### Community 177 - "Community 177"
Cohesion: 0.20
Nodes (5): medium(), save(), simple(), text_heavy(), wall()

### Community 178 - "Community 178"
Cohesion: 0.14
Nodes (14): ADMIN_DOMAIN, API_DOMAIN, PANDUARAH_ANON_KEY, PANDUARAH_API_URL, TLS_DIRECTIVE, VISITOR_DOMAIN, web, depends_on (+6 more)

### Community 179 - "Community 179"
Cohesion: 0.21
Nodes (11): RFC-9562, createImdfWriter(), IMDF_FEATURE_TYPES, ImdfFeature, ImdfFeatureType, ImdfGeometry, WrittenUnit, Polygonal (+3 more)

### Community 180 - "Community 180"
Cohesion: 0.24
Nodes (9): SearchField(), useDebouncedValue(), SEARCH_DEBOUNCE_MS, SEARCH_RESULTS_ID, VenueSearch(), onKeyDown(), submit(), OnScreenKeyboard() (+1 more)

### Community 181 - "Community 181"
Cohesion: 0.15
Nodes (13): ANON_KEY, AUTH_JWT_SECRET, DATABASE_URL, ENABLE_IMAGE_TRANSFORMATION, FILE_SIZE_LIMIT, FILE_STORAGE_BACKEND_PATH, GLOBAL_S3_BUCKET, POSTGREST_URL (+5 more)

### Community 182 - "Community 182"
Cohesion: 0.15
Nodes (12): patterns, prefix, actions, interval, updates, commit-message, directory, groups (+4 more)

### Community 183 - "Community 183"
Cohesion: 0.15
Nodes (3): IntegrationsRepository, ApiKey, Webhook

### Community 184 - "Community 184"
Cohesion: 0.15
Nodes (5): CryptoKey, CryptoKeyPair, KeyUsage, SubtleCrypto, TextEncoder

### Community 185 - "Community 185"
Cohesion: 0.15
Nodes (10): eastGf, facilities, index, [main, east], mainGf, mainL1, mainL2, outdoor (+2 more)

### Community 186 - "Community 186"
Cohesion: 0.27
Nodes (11): app.event_locations_before_insert(), app.license_has_feature(), event_locations_before_insert, event_locations_location_idx, events_before_write, events_floor_idx, events_touch_updated_at, events_venue_live_idx (+3 more)

### Community 188 - "Community 188"
Cohesion: 0.23
Nodes (12): steps, steps, BASE, CHANGES, E2E, steps, env, id (+4 more)

### Community 189 - "Community 189"
Cohesion: 0.17
Nodes (12): if, name, needs, runs-on, strategy, timeout-minutes, args, name (+4 more)

### Community 190 - "Community 190"
Cohesion: 0.17
Nodes (3): VendorClientsRepository, VendorLicense, VendorTrialRequest

### Community 191 - "Community 191"
Cohesion: 0.21
Nodes (10): EntranceFeature, BASE, corridor, EMPTY, FEATURES, m(), near(), point() (+2 more)

### Community 192 - "Community 192"
Cohesion: 0.30
Nodes (8): gridGraph(), { performance }, distance(), graphCost(), random(), randomGraph(), RandomGraphOptions, referenceCost()

### Community 193 - "Community 193"
Cohesion: 0.18
Nodes (7): anonHeaders, gzip, options, QUERIES, TABLE_USERS, tablePage(), tables()

### Community 194 - "Community 194"
Cohesion: 0.24
Nodes (6): Entry, GraphSaveQueueOptions, deferred(), setup(), venue, NavGraphChanges

### Community 195 - "Community 195"
Cohesion: 0.31
Nodes (7): Block(), BLOCKS, EulaConsent(), LegalBlock, legalTextVersion(), parseLegalText(), EULA_VERSION

### Community 196 - "Community 196"
Cohesion: 0.18
Nodes (6): LABEL_FONT, LATIN, LATIN_EXT, LABEL_FONT, LATIN, LATIN_EXT

### Community 197 - "Community 197"
Cohesion: 0.20
Nodes (11): environment, ALLOWED_ORIGINS, APP_VERSION, JWT_SECRET, LICENSE_VENDOR_URL, SEND_EMAIL_HOOK_SECRET, SUPABASE_ANON_KEY, SUPABASE_DB_URL (+3 more)

### Community 198 - "Community 198"
Cohesion: 0.20
Nodes (9): name, services, volumes, caddy-config, caddy-data, db-data, storage-data, x-logging (+1 more)

### Community 199 - "Community 199"
Cohesion: 0.20
Nodes (10): outputs, runs-on, jobs, changes, result, code, if, name (+2 more)

### Community 200 - "Community 200"
Cohesion: 0.27
Nodes (8): FieldRow, mapFieldRow(), mapLocationTypeRow(), toFieldRow(), TypeRow, field, FieldDefinitionIdSchema, LocationTypeIdSchema

### Community 201 - "Community 201"
Cohesion: 0.36
Nodes (9): ANALYTICS_BATCH_MAX, sanitizeAnalyticsEvents(), allow, clientAddress(), config(), corsHeaders, ingest(), json() (+1 more)

### Community 202 - "Community 202"
Cohesion: 0.38
Nodes (8): make_handler(), _allowed_origin(), _cors(), do_GET(), do_OPTIONS(), do_POST(), _fail(), _json()

### Community 203 - "Community 203"
Cohesion: 0.38
Nodes (9): app.backup_runs, app.health_alerts, app.health_backup_result(), app.health_conditions(), app.health_evaluate(), app.health_report(), app.server_health, backup_runs_finished_idx (+1 more)

### Community 204 - "Community 204"
Cohesion: 0.22
Nodes (9): command, environment, image, restart, volumes, PGPORT, POSTGRES_DB, POSTGRES_PASSWORD (+1 more)

### Community 205 - "Community 205"
Cohesion: 0.33
Nodes (5): ReceivedWebhook, signatureValid(), startWebhookReceiver(), shot(), visitorLabel()

### Community 206 - "Community 206"
Cohesion: 0.22
Nodes (9): with, cache, fetch-depth, if-no-files-found, key, name, node-version-file, path (+1 more)

### Community 207 - "Community 207"
Cohesion: 0.25
Nodes (8): depends_on, image, logging, restart, condition, db, depends_on, auth

### Community 208 - "Community 208"
Cohesion: 0.25
Nodes (8): PGRST_DB_ANON_ROLE, PGRST_DB_EXTRA_SEARCH_PATH, PGRST_DB_MAX_ROWS, PGRST_DB_SCHEMAS, PGRST_DB_URI, PGRST_DB_USE_LEGACY_GUCS, PGRST_JWT_SECRET, environment

### Community 209 - "Community 209"
Cohesion: 0.36
Nodes (3): license_of(), license_text(), main()

### Community 210 - "Community 210"
Cohesion: 0.29
Nodes (6): ALL, capture(), MENUS, shot(), SUPER_ADMIN_ONLY, WITHOUT_ADMIN_ONLY

### Community 211 - "Community 211"
Cohesion: 0.39
Nodes (7): base64(), Claimed, deliver(), dispatch(), encoder, rpc(), sign()

### Community 212 - "Community 212"
Cohesion: 0.29
Nodes (7): scripts, build, dev, lint, preview, test, typecheck

### Community 213 - "Community 213"
Cohesion: 0.29
Nodes (6): compilerOptions, jsx, lib, types, extends, include

### Community 214 - "Community 214"
Cohesion: 0.29
Nodes (5): compilerOptions, types, extends, include, $schema

### Community 215 - "Community 215"
Cohesion: 0.29
Nodes (6): compilerOptions, jsx, lib, types, extends, include

### Community 216 - "Community 216"
Cohesion: 0.29
Nodes (6): compilerOptions, jsx, lib, types, extends, include

### Community 217 - "Community 217"
Cohesion: 0.43
Nodes (6): clock(), DAY_KEYS, OpenStatus(), useMinute(), weekdayIn(), OpenState

### Community 218 - "Community 218"
Cohesion: 0.29
Nodes (6): compilerOptions, jsx, lib, types, extends, include

### Community 220 - "Community 220"
Cohesion: 0.57
Nodes (7): healthcheck, healthcheck, interval, retries, test, timeout, healthcheck

### Community 221 - "Community 221"
Cohesion: 0.29
Nodes (7): aliases, image, logging, networks, restart, default, functions

### Community 222 - "Community 222"
Cohesion: 0.29
Nodes (7): rest, condition, storage, depends_on, image, restart, volumes

### Community 223 - "Community 223"
Cohesion: 0.29
Nodes (6): compilerOptions, lib, types, exclude, extends, include

### Community 224 - "Community 224"
Cohesion: 0.33
Nodes (6): DAYS, dryRun, [file, ...flags], parseCsv(), text, usage()

### Community 225 - "Community 225"
Cohesion: 0.29
Nodes (6): concurrency, cancel-in-progress, group, name, permissions, contents

### Community 226 - "Community 226"
Cohesion: 0.29
Nodes (6): compilerOptions, jsx, lib, types, extends, include

### Community 227 - "Community 227"
Cohesion: 0.29
Nodes (6): compilerOptions, lib, types, exclude, extends, include

### Community 228 - "Community 228"
Cohesion: 0.40
Nodes (3): base64UrlDecode(), PUBLIC_FUNCTIONS, validJwt()

### Community 229 - "Community 229"
Cohesion: 0.33
Nodes (5): compilerOptions, lib, types, extends, include

### Community 230 - "Community 230"
Cohesion: 0.33
Nodes (5): compilerOptions, lib, types, extends, include

### Community 231 - "Community 231"
Cohesion: 0.33
Nodes (5): compilerOptions, lib, types, extends, include

### Community 232 - "Community 232"
Cohesion: 0.33
Nodes (5): compilerOptions, lib, types, extends, include

### Community 233 - "Community 233"
Cohesion: 0.33
Nodes (4): c, h, k, r

### Community 234 - "Community 234"
Cohesion: 0.33
Nodes (5): compilerOptions, lib, types, extends, include

### Community 235 - "Community 235"
Cohesion: 0.33
Nodes (5): compilerOptions, lib, types, extends, include

### Community 236 - "Community 236"
Cohesion: 0.33
Nodes (5): compilerOptions, lib, types, extends, include

### Community 237 - "Community 237"
Cohesion: 0.40
Nodes (4): compilerOptions, types, extends, include

### Community 238 - "Community 238"
Cohesion: 0.40
Nodes (4): compilerOptions, types, extends, include

### Community 239 - "Community 239"
Cohesion: 0.40
Nodes (4): compilerOptions, types, extends, include

### Community 240 - "Community 240"
Cohesion: 0.40
Nodes (5): on, pull_request, push, workflow_dispatch, branches

## Knowledge Gaps
- **9 isolated node(s):** `RFC-7946`, `RFC-4180`, `TARGETS`, `RFC-9562`, `RFC-6238` (+4 more)
  These have ≤1 connection - possible missing edges. (Counts symbols only; 2878 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **73 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react-i18next` connect `Community 103` to `Community 0`, `Community 69`, `Community 104`, `Community 73`, `Community 11`, `Community 82`, `Community 180`, `Community 52`, `Community 85`, `Community 217`, `Community 26`, `Community 91`, `Community 95`, `Community 31`?**
  _High betweenness centrality (0.036) - this node is a cross-community bridge._
- **What connects `RFC-7946`, `RFC-4180`, `TARGETS` to the rest of the system?**
  _9 weakly-connected nodes found - possible missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.04778593417002131 - nodes in this community are weakly interconnected._
- **Why does `VenueId` connect `Community 12` to `Community 0`, `Community 1`, `Community 2`, `Community 3`, `Community 4`, `Community 5`, `Community 7`, `Community 8`, `Community 10`, `Community 11`, `Community 140`, `Community 141`, `Community 13`, `Community 19`, `Community 20`, `Community 22`, `Community 28`, `Community 31`, `Community 33`, `Community 34`, `Community 37`, `Community 41`, `Community 42`, `Community 44`, `Community 46`, `Community 49`, `Community 59`, `Community 187`, `Community 64`, `Community 194`, `Community 66`, `Community 68`, `Community 70`, `Community 200`, `Community 73`, `Community 76`, `Community 79`, `Community 85`, `Community 91`, `Community 92`, `Community 95`, `Community 104`, `Community 107`, `Community 119`?**
  _High betweenness centrality (0.026) - this node is a cross-community bridge._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.031898613103778097 - nodes in this community are weakly interconnected._
- **Why does `Button()` connect `Community 0` to `Community 1`, `Community 5`, `Community 8`, `Community 10`, `Community 11`, `Community 141`, `Community 18`, `Community 147`, `Community 25`, `Community 27`, `Community 156`, `Community 31`, `Community 163`, `Community 38`, `Community 167`, `Community 41`, `Community 44`, `Community 172`, `Community 46`, `Community 48`, `Community 49`, `Community 52`, `Community 59`, `Community 64`, `Community 69`, `Community 73`, `Community 76`, `Community 83`, `Community 88`, `Community 89`, `Community 91`, `Community 95`, `Community 104`, `Community 106`, `Community 116`, `Community 119`, `Community 121`?**
  _High betweenness centrality (0.025) - this node is a cross-community bridge._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.028281519861830744 - nodes in this community are weakly interconnected._
<template>
    <div class="source-files">
        <p>version: {{ version.build }}</p>
        <h3>Data Files</h3>

        <section v-for="file in sourceFiles" :key="file.name">
            <h4><a :href="file.url" target="_blank" rel="noopener noreferrer">{{ file.name }}</a></h4>
            <p>
                {{ file.sources.length > 1 ? 'Sources:' : 'Source:' }}
                <template v-for="(source, index) in file.sources" :key="source.name">
                    <span v-if="index > 0">, </span>
                    <a :href="source.url" target="_blank" rel="noopener noreferrer">{{ source.name }}</a>
                </template>
            </p>
        </section>

        <p class="source-files__note">
            {{ t('sourceFiles.generatedNote') }}<br>
            {{ t('sourceFiles.repositoryNote') }}
            <a :href="sourceBaseUrl" target="_blank" rel="noopener noreferrer">{{ sourceBaseUrl }}</a>
        </p>
    </div>
</template>

<script setup>
import version from '@/data/version.json'
import buildingsUrl from '@/data/buildings.json?url'
import buildingsUnlockUrl from '@/data/buildingsUnlock.json?url'
import civilizationUrl from '@/data/civilization.json?url'
import pricesUrl from '@/data/prices.json?url&no-inline'
import { t } from '@/i18n'

const sourceBaseUrl = 'https://raw.githubusercontent.com/fishpondstudio/CivIdle/refs/heads/main'
const buildingDefinitionsUrl = `${sourceBaseUrl}/shared/definitions/BuildingDefinitions.ts`
const techDefinitionsUrl = `${sourceBaseUrl}/shared/definitions/TechDefinitions.ts`
const timedBuildingUnlockUrl = `${sourceBaseUrl}/shared/definitions/TimedBuildingUnlock.ts`
const cityDefinitionsUrl = `${sourceBaseUrl}/shared/definitions/CityDefinitions.ts`
const materialDefinitionsUrl = `${sourceBaseUrl}/shared/definitions/MaterialDefinitions.ts`
const upgradeDefinitionsUrl = `${sourceBaseUrl}/shared/definitions/UpgradeDefinitions.ts`

const sourceFiles = [
    {
        name: 'buildings.json',
        url: buildingsUrl,
        sources: [
            { name: 'BuildingDefinitions.ts', url: buildingDefinitionsUrl },
            { name: 'TechDefinitions.ts', url: techDefinitionsUrl },
            { name: 'TimedBuildingUnlock.ts', url: timedBuildingUnlockUrl },
            { name: 'CityDefinitions.ts', url: cityDefinitionsUrl }
        ]
    },
    {
        name: 'buildingsUnlock.json',
        url: buildingsUnlockUrl,
        sources: [
            { name: 'TechDefinitions.ts', url: techDefinitionsUrl },
            { name: 'UpgradeDefinitions.ts', url: upgradeDefinitionsUrl },
            { name: 'MaterialDefinitions.ts', url: materialDefinitionsUrl }
        ]
    },
    {
        name: 'civilization.json',
        url: civilizationUrl,
        sources: [{ name: 'CityDefinitions.ts', url: cityDefinitionsUrl }]
    },
    {
        name: 'prices.json',
        url: pricesUrl,
        sources: [
            { name: 'BuildingDefinitions.ts', url: buildingDefinitionsUrl },
            { name: 'TechDefinitions.ts', url: techDefinitionsUrl },
            { name: 'TimedBuildingUnlock.ts', url: timedBuildingUnlockUrl },
            { name: 'CityDefinitions.ts', url: cityDefinitionsUrl },
            { name: 'MaterialDefinitions.ts', url: materialDefinitionsUrl }
        ]
    }
]
</script>

<style scoped>
.source-files {
    box-sizing: border-box;
    max-width: 960px;
    margin: 0 auto;
    padding: 24px;
    color: #24292f;
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace;
    font-size: 15px;
    line-height: 1.6;
}

.source-files p,
.source-files h3,
.source-files h4 {
    margin: 0;
}

.source-files > p {
    margin-bottom: 20px;
    color: #57606a;
}

.source-files h3 {
    margin-bottom: 8px;
    font-size: 14px;
    font-weight: 600;
    color: #57606a;
    text-transform: uppercase;
}

.source-files section {
    padding: 12px 0;
    border-top: 1px solid #d8dee4;
}

.source-files h4 {
    font-size: 14px;
    font-weight: 600;
}

.source-files section p {
    margin-top: 4px;
    color: #57606a;
}

.source-files a {
    color: #0969da;
    text-decoration: none;
}

.source-files a:hover {
    text-decoration: underline;
}

.source-files__note {
    margin-top: 20px !important;
    padding-top: 12px;
    border-top: 1px solid #d8dee4;
    color: #57606a;
}

@media (max-width: 600px) {
    .source-files {
        padding: 16px;
    }
}
</style>

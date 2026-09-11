import { View, Text, StyleSheet } from 'react-native';
import { useSharedActivities, getOverdueForCreator } from '@/hooks/useSharedActivities';
import { PERSON_PROFILES } from '@/constants/personProfiles';
import { Radius, Spacing } from '@/constants/design';
import type { PersonId } from '@/types/database';

interface OverdueTasksBannerProps {
  personId: PersonId;
}

/**
 * Aviso de tarefas atrasadas. Mantém a cor âmbar de alerta em todos os
 * perfis de propósito: um aviso precisa parecer um aviso, não se dissolver
 * na paleta da pessoa.
 */
export function OverdueTasksBanner({ personId }: OverdueTasksBannerProps) {
  const { activities } = useSharedActivities();
  const overdue = getOverdueForCreator(activities, personId);
  if (overdue.length === 0) return null;

  const totalMissed = overdue.reduce((sum, o) => sum + o.missedDates.length, 0);

  return (
    <View style={styles.banner}>
      <View style={styles.titleRow}>
        <Text style={styles.icon}>⚠️</Text>
        <Text style={styles.title}>
          {totalMissed} tarefa{totalMissed > 1 ? 's' : ''} atrasada{totalMissed > 1 ? 's' : ''}
        </Text>
      </View>
      {overdue.map(({ activity, missedDates }) => {
        const responsibleName = activity.assignedTo ? PERSON_PROFILES[activity.assignedTo].name : '';
        const lastMissed = missedDates[missedDates.length - 1];
        return (
          <Text key={activity.id} style={styles.line}>
            {responsibleName} não marcou &quot;{activity.title}&quot; como feita em {lastMissed}
          </Text>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: '#FFF4D6',
    borderLeftWidth: 3,
    borderLeftColor: '#D99400',
    borderRadius: Radius.md,
    paddingVertical: Spacing.md + 2,
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  icon: { fontSize: 14, lineHeight: 18 },
  title: { flex: 1, fontSize: 13, fontWeight: '700', color: '#6B4E00' },
  line: { fontSize: 12, color: '#7A5B00', marginTop: Spacing.xs + 2, lineHeight: 17 },
});

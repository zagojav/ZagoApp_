import { View, Text, StyleSheet } from 'react-native';
import { useSharedActivities, getOverdueForCreator } from '@/hooks/useSharedActivities';
import { PERSON_PROFILES } from '@/constants/personProfiles';
import type { PersonId } from '@/types/database';

interface OverdueTasksBannerProps {
  personId: PersonId;
}

export function OverdueTasksBanner({ personId }: OverdueTasksBannerProps) {
  const { activities } = useSharedActivities();
  const overdue = getOverdueForCreator(activities, personId);
  if (overdue.length === 0) return null;

  const totalMissed = overdue.reduce((sum, o) => sum + o.missedDates.length, 0);

  return (
    <View style={styles.banner}>
      <Text style={styles.title}>
        ⚠️ {totalMissed} tarefa{totalMissed > 1 ? 's' : ''} atrasada{totalMissed > 1 ? 's' : ''}
      </Text>
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
  banner: { backgroundColor: '#FFF3CD', borderLeftWidth: 4, borderLeftColor: '#E6A700', borderRadius: 10, padding: 12, marginBottom: 16 },
  title: { fontSize: 13, fontWeight: '700', color: '#7A5B00', marginBottom: 4 },
  line: { fontSize: 12, color: '#7A5B00', marginTop: 2 },
});
